# Toni Nodejs & Bun Html to image server

## Setup

Run `npm i` or `bun i`

## Development (Hot reload)

Run `npm run dev` or `bun bundev`

## Running (no hot reload)

Run `npm start` or `bun bunstart`

## 🛠️ API Usage & Query Parameters

The server provides two main endpoints:
* `GET /render` - Returns the raw HTML/CSS view (great for testing and debugging).
* `GET /image` - Returns the generated PNG image.

Both endpoints accept the exact same URL query parameters to dynamically populate the ride-hailing template. If a parameter is omitted, the server will fall back to a default value.

### Available Parameters

| Parameter | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
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

---

### 💡 Examples

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

**⚠️ Important Notes**
- *External Images:* The /image endpoint automatically fetches external image URLs (backgroundImageUrl, driverImageUrl, carImageUrl) and converts them to Base64 before rendering. This ensures Puppeteer captures them reliably without timing out.
- *Scaling:* The template uses viewport-relative units (vw). This means the layout will scale perfectly regardless of the Puppeteer viewport dimensions you set in the server configuration.

