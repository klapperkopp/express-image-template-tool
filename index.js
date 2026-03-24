import express from "express"
import nodeHtmlToImage from "node-html-to-image"
import fs from "node:fs"
import Handlebars from "handlebars"

const app = express()
const port = 3000
const appUrl = `http://localhost:${port}`

app.use(express.static('public'))

// Read the default Handlebars template from the file system
async function readDefaultTemplate(templateName = "default") {
    const templateHtml = fs.readFileSync(`./templates/${templateName}.hbs`, 'utf8')
    const compiledTemplate = Handlebars.compile(templateHtml)
    return { templateHtml, compiledTemplate }
}

// 2. Helper Function: Fetch an image URL and convert it to a Base64 Data URI
async function fetchImageAsBase64(url) {
    if (!url) return ''
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

        if (response.headers.get("x-staticmap-api-warning")) console.warn(response.headers.get("x-staticmap-api-warning"))

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || 'image/png'

        return `data:${mimeType};base64,${buffer.toString('base64')}`
    } catch (error) {
        console.error(`Error converting ${url} to Base64:`, error.message)
        return url // Fallback to the original URL if fetch fails
    }
}

// 3. Helper Function: Extract query parameters with default fallbacks
const getRideParams = (query) => ({
    templateName: query.templateName || 'default',
    logoUrl: query.logoUrl || `${appUrl}/logo.png`,
    backgroundImageUrl: query.backgroundImageUrl || `${appUrl}/background.jpg`,
    driverName: query.driverName || 'Your Driver',
    driverImageUrl: query.driverImageUrl || `${appUrl}/driver.png`,
    driverRating: query.driverRating || '0,0',
    carImageUrl: query.carImageUrl || `${appUrl}/car.png`,
    carPlateNumber: query.carPlateNumber || 'HH FN 0000',
    carType: query.carType || 'Unknown Car Brand',
    etaUntilArrival: query.etaUntilArrival || 'a few minutes',
    width: query.width || 1920,
    height: query.height || 1080
})

// Helper Function: Get route polyline from Directions API
async function getRoutePolyline(startLocation, endLocation, apiKey) {
    try {
        const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'
        const params = new URLSearchParams({
            origin: startLocation,
            destination: endLocation,
            mode: 'driving',
            key: apiKey
        })

        const response = await fetch(`${baseUrl}?${params.toString()}`)
        if (!response.ok) throw new Error(`Directions API error: ${response.statusText}`)

        const data = await response.json()
        if (data.status !== 'OK') throw new Error(`Directions API: ${data.status}`)
        const encodedPolyline = data.routes[0].overview_polyline.points
        return encodedPolyline
    } catch (error) {
        console.error('Error fetching route polyline:', error.message)
        throw error
    }
}

// Helper Function: Generate Google Maps Static API URL with encoded polyline
async function generateMapsStaticUrlWithRoute(startLocation, endLocation, apiKey, width = 600, height = 400) {
    const encodedPolyline = await getRoutePolyline(startLocation, endLocation, apiKey)
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
    const params = new URLSearchParams({
        size: `${width}x${height}`,
        path: `color:0xff0000ff|weight:3|enc:${encodedPolyline}`,
        style: 'feature:road|element:geometry|color:0xcccccc',
        scale: '1',
        key: apiKey
    })
    params.append('markers', `color:green|label:A|${startLocation}`)
    params.append('markers', `color:red|label:B|${endLocation}`)
    return `${baseUrl}?${params.toString()}`
}

// --- ENDPOINTS ---

// Endpoint A: Render the HTML directly in the browser
app.get('/render', async (req, res) => {
    const params = getRideParams(req.query)

    // Pass the raw parameters directly into the compiled Handlebars template
    const { compiledTemplate } = await readDefaultTemplate(params.templateName)
    const html = compiledTemplate(params)
    res.send(html)
})

// Endpoint B: Generate and return the Image
app.get('/image', async (req, res) => {
    try {
        const params = getRideParams(req.query)

        // Convert external image URLs to Base64 to ensure Puppeteer captures them reliably
        const [bgBase64, driverBase64, carBase64, logoBase64] = await Promise.all([
            fetchImageAsBase64(params.backgroundImageUrl),
            fetchImageAsBase64(params.driverImageUrl),
            fetchImageAsBase64(params.carImageUrl),
            fetchImageAsBase64(params.logoUrl)
        ])

        // Inject the Base64 strings back into the parameters object
        const renderParams = {
            ...params,
            backgroundImageUrl: bgBase64,
            driverImageUrl: driverBase64,
            carImageUrl: carBase64,
            logoImageUrl: logoBase64
        }

        // Generate the image buffer
        const { templateHtml } = await readDefaultTemplate(params.templateName)
        const imageBuffer = await nodeHtmlToImage({
            html: templateHtml,
            content: renderParams,
            puppeteerArgs: {
                defaultViewport: {
                    width: params.width, // Container is 1920px
                    height: params.height // Container is 1080px
                }
            }
        })

        // Send the image back to the client
        res.set('Content-Type', 'image/png')
        res.send(imageBuffer)

    } catch (error) {
        console.error('Error generating image:', error)
        res.status(500).send('An error occurred while generating the image.')
    }
})

// Endpoint C: Render Map Route
app.get('/renderMap', async (req, res) => {
    try {
        const { startLocation, endLocation, apiKey, width = 600, height = 400, returnType = 'html' } = req.query

        const usedApiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY

        if (!startLocation || !endLocation || !usedApiKey) {
            return res.status(400).send('Missing required parameters: startLocation, endLocation, apiKey')
        }

        const mapsUrl = await generateMapsStaticUrlWithRoute(startLocation, endLocation, usedApiKey, width, height)
        const mapImageBase64 = await fetchImageAsBase64(mapsUrl)

        if (returnType === 'image') {
            // Return directly as image
            const imageBuffer = Buffer.from(mapImageBase64.split(',')[1], 'base64')
            res.set('Content-Type', 'image/png')
            res.send(imageBuffer)
        } else {
            // Return as HTML (default)
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Route Map</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                        img { border: 1px solid #ccc; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <h1>Route Map</h1>
                    <img src="${mapImageBase64}" alt="Route Map" width="${width}" height="${height}">
                </body>
                </html>
            `
            res.send(html)
        }

    } catch (error) {
        console.error('Error rendering map:', error)
        res.status(500).send('An error occurred while rendering the map.')
    }
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    console.log(`- HTML view: http://localhost:${port}/render`)
    console.log(`- Image view: http://localhost:${port}/image`)
})