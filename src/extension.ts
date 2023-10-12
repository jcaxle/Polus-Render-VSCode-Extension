// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { InputBoxOptions } from "vscode";
import { spawn } from "child_process";
var path = require("path");

/**
 * Prompts the user to enter image URL
 * @returns URL or Path to user input.
 * - If none specified, returns ""
 * - If specified, returns nonempty string
 * - if cancelled, returned undefined
 */
async function promptImage(): Promise<string | undefined> {
  let imageLocation = await vscode.window.showInputBox({
    title: "Enter Image URL",
    prompt: "Enter to submit URL, leave blank to skip, ESC to open file picker",
    placeHolder: "Zarr/Tif URL",
  });

  if (imageLocation === undefined) {
    // User selects dataset type, due to limitations that file & folder can't be shown together
    let imageType = await vscode.window.showQuickPick(
      [
        { label: "Zarr", description: "*.zarr", target: "zarr" },
        { label: "Tif", description: "*.ome.tif", target: "tif" },
      ],
      { placeHolder: "Select the extension type of your dataset" }
    );

    if (imageType === undefined) {
      return;
    }

    let selectedFile: vscode.Uri[] | undefined;
    if (imageType.target === "zarr") {
      selectedFile = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select Image",
        openLabel: "Select Image",
        filters: { Image: [imageType.target] },
      });
    } else {
      selectedFile = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        title: "Select Image",
        openLabel: "Select Image",
        filters: { Image: [imageType.target] },
      });
    }

    if (selectedFile) {
      imageLocation = selectedFile[0].fsPath;
    }
    // Since user cancelled both prompts, skip opening render
    else {
      return;
    }
  }
}

/**
 * Prompts the user to enter overlay URL
 * @returns URL or Path to user input.
 * - If none specified, returns ""
 * - If specified, returns nonempty string
 * - if cancelled, returned undefined
 */
async function promptOverlay(): Promise<string | undefined> {
  let overlayLocation = await vscode.window.showInputBox({
    title: "Enter Overlay URL",
    prompt: "Enter to submit URL, leave blank to skip, ESC to open file picker",
    placeHolder: "MicroJSON URL",
  });
  // File prompt if Undefined
  if (overlayLocation === undefined) {
    let selectedFile = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      title: "Select Overlay",
      openLabel: "Select Overlay",
      filters: { Overlay: ["json"] },
    });
    if (selectedFile) {
      overlayLocation = selectedFile[0].fsPath;
    }
    // Since user cancelled both prompts, skip opening render
    else {
      return;
    }
  }
}
// TODO Adjust to not use python
/**
 * Run Render and open a tab in VSCode.
 * @param imageLocation: image location. Empty string if not specified
 * @param overlayLocation: overlay location. Empty string if not specified
 * @param renderType: Acquired from promptRenderType
 */
function buildRunRender(
  imageLocation: string,
  overlayLocation: string,
  renderType: { label: string; description: string; target: string } | undefined
) {
  // Fix undefined if it occurs and make args ready for spawn
  imageLocation = imageLocation.length > 0 ? imageLocation : imageLocation;
  overlayLocation =
    overlayLocation.length > 0 ? overlayLocation : overlayLocation;

  let typeFlag = "";
  if (renderType !== undefined && renderType.target === "online") {
    typeFlag = "-t";
  }
  let absPath = path.resolve(
    "C:/Users/JeffChen/OneDrive - Axle Informatics/Documents/working/polus-render/src/polus-render-wrapper.py"
  );

  // Build args
  let args = ["-d", absPath];
  if (imageLocation !== "") {
    args.push("-i", imageLocation);
  }
  if (overlayLocation !== "") {
    args.push("-o", overlayLocation);
  }
  if (typeFlag !== "") {
    args.push("-t");
  }

  console.log(JSON.stringify(args));
  let child = spawn("python", args);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", function (data) {
    vscode.window.showInformationMessage(data.toString());
    let panel = vscode.window.createWebviewPanel(
      "render",
      "Render",
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [vscode.Uri.file("/")] }
    );
    panel.webview.html = buildHTML(data.toString());
  });
  child.stderr.setEncoding("utf8");

  child.stderr.on("data", function (data) {
    vscode.window.showErrorMessage(data.toString());
  }); //vscode.window.showInformationMessage("Has finished running");

  child.on("close", function (code) {
    //Here you can get the exit code of the script

    vscode.window.showInformationMessage(
      "Polus Render has closed with code: " + code?.toString()
    );
  });
}

/**
 * Prompt the user for which type of render they would like to use
 * @returns json with label, description, and target parameters.
 */
async function promptRenderType(): Promise<
  { label: string; description: string; target: string } | undefined
> {
  return await vscode.window.showQuickPick(
    [
      {
        label: "Online Build",
        description: "https://render.ci.ncats.io/",
        target: "online",
      },
      {
        label: "Local Build",
        description: "Bundled Polus Render",
        target: "local",
      },
    ],
    { placeHolder: "Select which build you would like to use" }
  );
}

/**
 * Returns a full HTML of an IFrame of Polus Render
 * @param renderURL: URL of Polus Render to insert into HTML
 */
function buildHTML(renderURL: string) {
  return `
            <!DOCTYPE html> 
            <html> 
              
            <head> 
                <title>full screen iframe</title> 
                <style type="text/css"> 
                    html { 
                        overflow: auto; 
                    } 
                      
                    html, 
                    body, 
                    div, 
                    iframe { 
                        margin: 0px; 
                        padding: 0px; 
                        height: 100%; 
                        border: none; 
                    } 
                      
                    iframe { 
                        display: block; 
                        width: 100%; 
                        border: none; 
                        overflow-y: auto; 
                        overflow-x: hidden; 
                    } 
                </style> 
            </head> 
              
            <body> 
                <iframe src=${renderURL}"
                        frameborder="0" 
                        marginheight="0" 
                        marginwidth="0" 
                        width="100%" 
                        height="100%" 
                        scrolling="auto"
                        id="mountPoint"> 
              </iframe> 
              
            </body> 
              
            </html> `;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // OpenPolusRender prompts the user to enter both overlay, local, and to use local or online render
  let customRender = vscode.commands.registerCommand(
    "polus-render.openPolusRender",
    async (ctx) => {
      let imageLocation = await promptImage();
      if (imageLocation === undefined) {
        return;
      }

      let overlayLocation = await promptOverlay();
      if (overlayLocation === undefined) {
        return;
      }

      let renderType = await promptRenderType();

      // Fix undefined if it occurs and make args ready for spawn
      imageLocation = imageLocation.length > 0 ? imageLocation : imageLocation;
      overlayLocation =
        overlayLocation.length > 0 ? overlayLocation : overlayLocation;

      let typeFlag = "";
      if (renderType !== undefined && renderType.target === "online") {
        typeFlag = "-t";
      }
      buildRunRender(imageLocation, overlayLocation, renderType);
    }
  );
  // openZarr is a function which prompts the user to select between local/online render then opens
  // render with provided zarr file
  let openZarr = vscode.commands.registerCommand(
    "polus-render.openZarr",
    async (ctx) => {
      let path = ctx.path;

      // path must be specified
      if (path === undefined) {
        return;
      }

      // Get render type
      let renderType = await promptRenderType();
    }
  );
  context.subscriptions.push(customRender, openZarr);
}

// This method is called when your extension is deactivated
export function deactivate() {}
