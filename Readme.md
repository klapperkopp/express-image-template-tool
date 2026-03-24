# Toni Nodejs & Bun Html to image server

## Setup

Run `npm i` or `bun i`

### Google Maps API Key Setup

The `/renderMap` endpoint requires a Google Maps API key to fetch route information.

1. **Get your API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - **Maps Static API**
     - **Directions API**
   - Create an API key (Credentials → Create Credentials → API Key)

2. **Configure the API Key:**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export GOOGLE_MAPS_API_KEY=your_api_key_here && npm start
   ```
   
   **Option B: Query Parameter**
   ```text
   http://localhost:3000/renderMap?startLocation=52.520008,13.404954&endLocation=48.856613,2.352222&apiKey=YOUR_API_KEY
   ```

## Development (Hot reload)

Run `npm run dev` or `bun bundev`

## Running (no hot reload)

Run `npm start` or `bun bunstart`

## 🛠️ API Usage & Query Parameters

The server provides three main endpoints:
* `GET /render` - Returns the raw HTML/CSS view (great for testing and debugging).
* `GET /image` - Returns the generated PNG image.
* `GET /renderMap` - Returns a Google Maps route visualization.

### Endpoint 1 & 2: `/render` and `/image`

Both endpoints accept the exact same URL query parameters to dynamically populate the ride-hailing template. If a parameter is omitted, the server will fall back to a default value.

#### Available Parameters

| Parameter | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `templateName` | `string` | The template file name in <project root>/templates/templateName.hbs (without .hbs). | `default`|
| `backgroundImageUrl` | `string` | The background image URL. | *(Placeholder Image)* |
| `logoUrl` | `string` | The logo or image URL. | *(Placeholder Image)* |
| `driverName` | `string` | First and/or last name of the driver. | `Your Driver` |
| `driverImageUrl` | `string` | URL to the driver's profile photo. | *(Placeholder Image)* |
| `driverRating` | `string` | The driver's star rating. | `0,0` |
| `carImageUrl` | `string` | URL to an image of the car. | *(Placeholder Image)* |
| `carPlateNumber` | `string` | The vehicle's license plate. | `HH FN 0000` |
| `carType` | `string` | Make and model of the car. | `Unknown Car Brand` |
| `etaUntilArrival` | `string` | The estimated time of arrival. | `a few minutes` |
| `width` | `string` | The width of the rendered image or maxHeight of the rendered website in px. | `1920` |
| `height` | `string` | The height of the rendered image or maxHeight of the rendered website in px. | `1080` |

#### Examples

**1. Basic Usage (using defaults)**
```text
http://localhost:3000/image
```

**2. Updating Text Parameters**
Remember to URL-encode your strings (e.g., use %20 or + for spaces).
```text
http://localhost:3000/image?driverName=Sarah%20Connor&etaUntilArrival=Arriving%20Now&carType=Jeep%20Wrangler&carPlateNumber=ABC-123
```

**3. Fully Customized (Including Images)**
When passing URLs for images, ensure they are publicly accessible so the server can fetch and process them.

```text
http://localhost:3000/image?driverName=John+Doe&driverRating=5.0&etaUntilArrival=5+mins&driverImageUrl=https://res.cloudinary.com/daurlqejg/image/upload/v1774366504/driversample_dqfea6.jpg&carImageUrl=https://res.cloudinary.com/daurlqejg/image/upload/v1774366362/WhatsApp_Image_2026-03-24_at_16.09.03_ufllev.jpg
```

---

### Endpoint 3: `/renderMap` (Route Visualization)

This endpoint generates a Google Maps image showing a driving route between two locations.

#### Available Parameters

| Parameter | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `startLocation` | `string` | Starting point (latitude,longitude or address). | ✅ Yes |
| `endLocation` | `string` | Destination point (latitude,longitude or address). | ✅ Yes |
| `apiKey` | `string` | Google Maps API Key. Can be omitted if `GOOGLE_MAPS_API_KEY` env var is set. | ⚠️ Conditional |
| `width` | `number` | Map image width in pixels. | No (default: 600) |
| `height` | `number` | Map image height in pixels. | No (default: 400) |
| `returnType` | `string` | Response format: `html` or `image`. | No (default: html) |
| `marker` | `string` | Custom marker(s) to display on the map. Can be repeated multiple times. | No |

#### Marker Format

Custom markers follow the Google Maps Static API marker format:
```
color:COLOR|label:LABEL|latitude,longitude
```

**Examples:**
- `color:blue|label:C|50.1109,8.6821` - Blue marker with label "C"
- `color:orange|label:D|49.6116,6.1319` - Orange marker with label "D"

#### Examples

**1. Basic Route (HTML View)**
```text
http://localhost:3000/renderMap?startLocation=52.520008,13.404954&endLocation=48.856613,2.352222
```

**2. Return as Direct Image**
```text
http://localhost:3000/renderMap?startLocation=52.520008,13.404954&endLocation=48.856613,2.352222&returnType=image
```

**3. With Custom Markers**
```text
http://localhost:3000/renderMap?startLocation=52.520008,13.404954&endLocation=48.856613,2.352222&marker=color:blue|label:Pickup|52.520008,13.404954&marker=color:orange|label:Stop1|50.1109,8.6821&returnType=image
```

**4. Custom Dimensions**
```text
http://localhost:3000/renderMap?startLocation=Berlin&endLocation=Munich&width=800&height=600&returnType=html
```

**5. Using Address Names**
```text
http://localhost:3000/renderMap?startLocation=Times+Square,New+York&endLocation=Central+Park,New+York&returnType=image
```

---

## ⚠️ Important Notes

### External Images
- The `/image` endpoint automatically fetches external image URLs (backgroundImageUrl, driverImageUrl, carImageUrl) and converts them to Base64 before rendering. This ensures Puppeteer captures them reliably without timing out.

### Scaling
- The template uses viewport-relative units (vw). This means the layout will scale perfectly regardless of the Puppeteer viewport dimensions you set in the server configuration.

### Maps API Limits
- The Google Maps Static API has a maximum URL length of 8,192 characters. Complex routes with many custom markers may exceed this limit.
- Be aware of your API usage quotas and billing settings in the Google Cloud Console.

### Route Snapping
- The `/renderMap` endpoint uses the **Google Directions API** to snap routes to actual roads, ensuring accurate driving directions are displayed on the map.

