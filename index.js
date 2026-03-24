import express from "express"
import nodeHtmlToImage from "node-html-to-image"
import fs from "node:fs"
import Handlebars from "handlebars"

const app = express()
const port = 3000
const appUrl = `http://localhost:${port}`

app.use(express.static('public'))

// 1. Read the Handlebars template from the file system
const templateHtml = fs.readFileSync('./template.hbs', 'utf8')
const compiledTemplate = Handlebars.compile(templateHtml)

// 2. Helper Function: Fetch an image URL and convert it to a Base64 Data URI
async function fetchImageAsBase64(url) {
    if (!url) return ''
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

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

// --- ENDPOINTS ---

// Endpoint A: Render the HTML directly in the browser
app.get('/render', (req, res) => {
    const params = getRideParams(req.query)

    // Pass the raw parameters directly into the compiled Handlebars template
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

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    console.log(`- HTML view: http://localhost:${port}/render`)
    console.log(`- Image view: http://localhost:${port}/image`)
})