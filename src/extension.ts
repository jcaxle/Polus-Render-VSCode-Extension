// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { URL, Path, PolusArgs, Polus } from "./polus-render";
import {exec} from "child_process"
var portsInUse:number[] = []
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


  /**
   * Checks if string is url by matching http:// or https:// at beginning of string.
   * Normalize string with trim() and toLowercase()
   * @param target possible url string
   * @returns True if string is URL, false if not URL
   */
  function isUrl(target: string) {
    let s = target.trim().toLowerCase();
    return s.startsWith("http://") || s.startsWith("https://");
  }

  /**
   * Prompts the user to enter image URL
   * @returns URL or Path to user input.
   * - If none specified, returns ""
   * - If specified, returns nonempty string
   * - if cancelled, returned undefined
   */
  async function promptImage(): Promise<Path | URL | undefined> {
    let imageLocation = await vscode.window.showInputBox({
      title: "Enter Image URL",
      prompt:
        "Enter to submit URL or File path, leave blank to skip, ESC to open file picker",
      placeHolder: "Zarr/Tif URL",
    });

    if (imageLocation === undefined) {
      // User selects dataset type, due to limitations that file & folder can't be shown together
      let imageType = await vscode.window.showQuickPick(
        [
          { label: "Zarr", description: "*.zarr", target: "zarr" },
          { label: "Tif", description: "*.ome.tif", target: "tif" },
        ],
        { placeHolder: "Select the extension type of your dataset" },
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
        return { path: selectedFile[0].fsPath };
      }
      // Since user cancelled both prompts, skip opening render
      else {
        return;
      }
    }

    if (isUrl(imageLocation)) {
      return { url: imageLocation };
    }
    return { path: imageLocation };
  }

  /**
   * Prompts the user to enter overlay URL
   * @returns URL or Path to user input.
   * - If none specified, returns ""
   * - If specified, returns nonempty string
   * - if cancelled, returned undefined
   */
  async function promptOverlay(): Promise<Path | URL | undefined> {
    let overlayLocation = await vscode.window.showInputBox({
      title: "Enter Overlay URL",
      prompt:
        "Enter to submit URL, leave blank to skip, ESC to open file picker",
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
        return { path: selectedFile[0].fsPath };
      }
      // Since user cancelled both prompts, skip opening render
      else {
        return;
      }
    }
    if (isUrl(overlayLocation)) {
      return { url: overlayLocation };
    }
    return { path: overlayLocation };
  }

  /**
   * Run Render and open a tab in VSCode.
   * @param imageLocation: image location. Empty string if not specified
   * @param overlayLocation: overlay location. Empty string if not specified
   * @param renderType: Acquired from promptRenderType
   */
  async function buildRunRender(
    imageLocation: Path | URL,
    overlayLocation: Path | URL,
    renderType:
      | { label: string; description: string; target: string }
      | undefined,
    context: vscode.ExtensionContext,
  ) {
    let isLocal;

    // Fix undefined if it occurs and make args ready for spawn
    if (renderType !== undefined && renderType.target === "online") {
      isLocal = false;
    } else {
      isLocal = true;
    }

    let args: PolusArgs = {
      imageLocation,
      overlayLocation,
      useLocalRender: isLocal,
    };
    let polus = new Polus(args);
    let polusURL = await polus.render(
      context.asAbsolutePath("src/apps/render-ui"),
    );
    console.log(JSON.stringify(polusURL))
    vscode.commands.executeCommand("simpleBrowser.show", [polusURL.url])

    // Save ports
    polusURL.ports.forEach((port) => {
      portsInUse.push(port)
    })
    
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
      { placeHolder: "Select which build you would like to use" },
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
                <iframe src=${renderURL}
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
      await buildRunRender(imageLocation, overlayLocation, renderType, context);
    },
  );

  /**
   * User selected .zarr or .tif command action
   * @param ctx obtained from vscode command on .zarr or .tif context menus
   * @returns
   */
  async function withImage(ctx: any) {
    // Normalize path
    let path = ctx.fsPath.replace(/\\/g, '/');
    // path must be specified
    if (path === undefined) {
      return;
    } 
    
    // Trim path up to 1st .zarr if does not end in tif
    if (!path.endsWith("tif")){
      let tokens = path.split(".zarr")
      let left = tokens[0]
      let rightTokens = tokens[1].split('/')
      path =  left + ".zarr" + rightTokens[0]
      console.log("broken up: " + path)
    }

    if (isUrl(path)) {
      path = { url: path };
    } else {
      path = { path: path };
    }
    let overlayLocation;
    if (!vscode.workspace.getConfiguration("prompt.overlay").get("disable")) {
      overlayLocation = await promptOverlay();
      if (overlayLocation === undefined) {
        return;
      }
    } else {
      overlayLocation = { path: "" };
    }

    // Get render type
    let renderType;
    if (!vscode.workspace.getConfiguration("prompt.polus.type").get("disable")) {
      renderType = await promptRenderType();
    } else {
      if (
        vscode.workspace.getConfiguration("prompt.default").get("local")
      ) {
        renderType = {
          label: "Local Build",
          description: "Bundled Polus Render",
          target: "local",
        };
      } else {
        renderType = {
          label: "Online Build",
          description: "https://render.ci.ncats.io/",
          target: "online",
        };
      }
    }

    // Run render
    await buildRunRender(path, overlayLocation, renderType, context);
  }

  // openZarr is a function which prompts the user to select between local/online render then opens
  // render with provided zarr file
  let openZarr = vscode.commands.registerCommand(
    "polus-render.openZarr",
    async (ctx) => {
      withImage(ctx);
    },
  );

  // openTif is the same as openZarr. Used b/c each command can only have 1 prompt
  let openTif = vscode.commands.registerCommand(
    "polus-render.openTif",
    async (ctx) => {
      withImage(ctx);
    },
  );
  const allExtensions: readonly any[] = vscode.extensions.all;
  console.log("All commands: " + JSON.stringify(vscode.extensions.getExtension("")))
  context.subscriptions.push(customRender, openZarr, openTif);
}

// This method is called when your extension is deactivated
export function deactivate() {
  portsInUse.forEach((port)=>{
    exec(`npx kill-port ${port}`, function (error, stdout, stderr) {
      console.log(stdout);
    });
  })
}
