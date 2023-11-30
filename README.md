# Polus Render VSCode Extension
Polus Render VSCode Extension makes Polus Render available as a VSCode extension. Based on [polus-render](https://github.com/jcaxle/polus-render).

Polus Render allows visualizing tiled raster datasets in Zarr and TIFF formats, as well as vector overlays in MicroJSON format. It uses lookup tables to map intensity values in these datasets to colors.

<img src="README assets/home.png" style="display: block; margin-left: auto; margin-right: auto; width: 100%;"/>


# Loading data
1. Right clicking a `.zarr` or `.OME.TIFF` file in the VSCode explorer and selecting `open <ext> with Polus Render`.
> <img src="README assets/load-1.png" style="display: block; margin-left: auto; margin-right: auto; width: 50%;"/>
2. Clicking `Polus Render` button on the status bar
> <img src="README assets/load-2.png"   style="display: block; margin-left: auto; margin-right: auto; width: 50%;"/>

# Requirements
- VSCode: `^1.79.0`

# Installation
- Add the `vsix` file to the VSCode explorer. Right click the file then select `Install Extension VSIX` from context menu.

# Dev Installation
```
git clone https://github.com/jcaxle/Polus-Render-VSCode-Extension.git
cd Polus-Render-VSCode-Extension
npm i
```

# Testing Extension
## 1. Compile extension
```
cd Polus-Render-VSCode-Extension
tsc -p ./
```

## 2. Move files
- Within VSCode, move generated `extension.js` and `extension.map.js` into `dist/`. Accept import changes prompt when it appears for `extension.js`.

## 3. Running extension
- Open `extension.ts` in the editor then enter the VSCode debugger for extensions.

# Project File Structure
```
Polus-Render-VSCode-Extension
| package.json                    // Includes VSCode Extension configuration options alongside package requirements.
| package-lock.json
| tsconfig.json                   // TS config, must be kept to ES2020.
| webpack.condfig.js              // Bundling instructions.
| CHANGELOG.md
| LICENSE
| .gitignore
| README          
└───images                        // Contains PolusAI icons.
└─── README assets                // Assets used for the README.
└───dist                          // Location of JS files compiled from TS files.
└───src
    | extension.ts                // Main entry point into extension, contains all VSCode functionality.
    | polus-render.ts             // Contains all functionality for Polus Render.
    | http-server.ts              // HTTP server.
    ├───apps           
    │   ├───render-ui              // Static Polus Render build files.
    └───test                       // Test files.
```
# Build Instructions
- In root directory, run `vsce package`.
- This will generated a `polus-render-<version>.vsix` file which can be distributed.

# Static Render functionality
Polus Render VSCode Extension is bundled with a static build of Polus Render.

| Version           | Zarr from URL/Path | TIF from URL/Path   | Micro-JSON Support | Zarr/TIF Drag & Drop | Micro-JSON Drag & Drop | 
|----------------|---------------|---------------|----------------|-----------|-----|
| Local | ✔️  | ✔️ | ✔️ | ❌ | ❌

# Prompt Navigation
## Image Prompt
<img src="README assets/image_prompt.png" style="display: block; margin-left: auto; margin-right: auto; width: 100%;"/>

- Enter a url or file path to an image file to load.
- To load an `OME.TIFF` file from the file dialog, click the file icon on the top right.
- To load a `.zarr` file from the file dialog, click the folder icon on the top right.

## Overlay Prompt
<img src="README assets/overlay_prompt.png" style="display: block; margin-left: auto; margin-right: auto; width: 100%;"/>

- Enter a url or file path to an microJson overlay file to load.
- To load a `.json` file from the file dialog, click the file icon on the top right.

## Render Type Prompt
<img src="README assets/render_prompt.png" style="display: block; margin-left: auto; margin-right: auto; width: 100%;"/>

- Choose either to use the static or online build of Polus Render.

# Configuration
Options are all enabled by default. Affects only the right click open functionality in the explorer.
- `Prompt>Default:Local` - Enable to use local build of render by default, Disable for online build of render by default.
- `Prompt>Overlay:Disable` - Enable to not show prompt for an additional overlay when opening image files. Disable to show prompt.
- `Prompt>Polus>Type:Disable` - Enable to not show which Render type to use, Disable to show which Render type to use.

# Implementation Details
Render application is loaded within VSCode's built in `Simple Browser` The extension allows pointing the browser at:
* Render deployed to a server.
* An HTTP Server running on localhost and serving a static build of Render which has been bundled with this package.