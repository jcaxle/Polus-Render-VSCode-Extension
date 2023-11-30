import * as vscode from "vscode";
import { URL, Path, PolusArgs, Polus } from "./polus-render";
import {exec} from 'child_process'
import EventEmitter = require('node:events');


// Keeps a list of ports in used, ports are closed when deactivate() is called
var portsInUse:number[] = []


export function activate(context: vscode.ExtensionContext) {

  // Buttons --------------------------------------------------
  const openZarrBtn: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("file-symlink-directory"),
    tooltip: "Open .zarr",
  };

  const openOmeTiffBtn: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("file-symlink-file"),
    tooltip: "Open OME.TIFF",
  };

  const openJSONBtn: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("file-symlink-file"),
    tooltip: "Open .json",
  };

  // Local Reusable variables ---------------------------------
  
  /* Event emitter used to circumnavigate createInputBox design
     In specifics, createInputBox wants to be designed in a way
     where it runs async from your main thread, similar to a 
     standalone extension command.
  */
  let pathEmitterValue:Path | URL | undefined = undefined
  const pathEmitter = new EventEmitter();

  pathEmitter.on('location', function firstListener(location: Path | URL | undefined) {
    pathEmitterValue = location
  });

  // Helpers -------------------------------------------------
  /**
   * Checks if string is url by matching http:// or https:// at beginning of string.
   * Normalizes string with trim() and toLowercase()
   * @param target: possible url string
   * @returns True if string is URL, false if not URL
   */
  function isUrl(target: string) {
    let s = target.trim().toLowerCase();
    return s.startsWith("http://") || s.startsWith("https://");
  }

  /**
   * Return a promise from an event
   * 
   * @param emitter (EventEmitter): Event emitter
   * @param event (string): Specific event from emitter 
   * @returns Promise linked to event
   */
  function getPromiseFromEvent(emitter:EventEmitter, event:string) {
    return new Promise<void>((resolve) => {
      const listener = () => {
        emitter.removeListener(event, listener);
        resolve();
      }
      emitter.addListener(event, listener);
    })
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
      let isStatic;
  
      // Fix undefined if it occurs and make args ready for spawn
      if (renderType !== undefined && renderType.target === "online") {
        isStatic = false;
      } else {
        isStatic = true;
      }
  
      let args: PolusArgs = {
        imageLocation,
        overlayLocation,
        useLocalRender: isStatic,
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

  // Modular vscode extension components ---------------------------
  /**
   * Prompts the user to enter image URL
   * @returns URL or Path to user input.
   * - If none specified, returns Path whose path is ""
   * - If specified, returns Path | URL
   * - if cancelled, returned undefined
   */
  async function promptImage(): Promise<Path | URL | undefined> {

    let prompt = vscode.window.createInputBox()
    prompt.title = "Enter Image URL or File Path"
    prompt.prompt = "Enter URL or File Path"
    prompt.placeholder = "Zarr/OME.TIFF Image"
    prompt.ignoreFocusOut = true
    prompt.buttons = [openZarrBtn, openOmeTiffBtn]

    prompt.onDidTriggerButton(async (btn) => {
      prompt.dispose()
      if (btn === openZarrBtn){
        let value =  await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          title: "Select Image",
          openLabel: "Select Image",
          filters: { Folder: ["/.*\\.zarr.*/"] },
        });
        
        if (value)
          pathEmitter.emit("location", {path : value[0].fsPath})
        else
          pathEmitter.emit("location", undefined)

      }
      else if(btn === openOmeTiffBtn){
        let value = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          title: "Select Image",
          openLabel: "Select Image",
          filters: { Image: ["tif", "tiff"] },
        });
        
        if (value)
        pathEmitter.emit("location", {path : value[0].fsPath})
      }
    })

    prompt.onDidAccept(() => {
        prompt.dispose()

        if (isUrl(prompt.value)) {
          pathEmitter.emit("location",  { url: prompt.value })
        }
        pathEmitter.emit("location", { path: prompt.value })
       })
    
    prompt.show()
    await getPromiseFromEvent(pathEmitter, "location")
    return pathEmitterValue
  }

  /**
   * Prompts the user to enter overlay URL
   * @returns URL or Path to user input.
   * - If none specified, returns Path whose path is ""
   * - If specified, returns Path | URL
   * - if cancelled, returned undefined
   */
  async function promptOverlay(): Promise<Path | URL | undefined> {

    let prompt = vscode.window.createInputBox()
    prompt.title = "Enter Overlay URL or File Path",
    prompt.prompt = "Enter URL or File Path",
    prompt.placeholder = "Json file",
    prompt.ignoreFocusOut = true
    prompt.buttons = [openJSONBtn]

    prompt.onDidTriggerButton(async (btn) => {
      prompt.dispose()
      if (btn === openJSONBtn){
        let value = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectMany: false,
          title: "Select Overlay",
          openLabel: "Select Overlay",
          filters: { Overlay: ["json"] },
        });
        
        if (value)
          pathEmitter.emit("location", {path : value[0].fsPath})
        else
          pathEmitter.emit("location", undefined)

      }
    })

    prompt.onDidAccept(() => {
        prompt.dispose()

        if (isUrl(prompt.value)) {
          pathEmitter.emit("location",  { url: prompt.value })
        }
        pathEmitter.emit("location", { path: prompt.value })
       })
    
    prompt.show()
    await getPromiseFromEvent(pathEmitter, "location")
    return pathEmitterValue
  }



  /**
   * Prompt the user for which type of render they would like to use
   * @returns json with label, description, and target parameters or undefined
   *          if user cancels prompt.
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
          label: "Static Build",
          description: "Bundled Polus Render",
          target: "static",
        },
      ],
      { placeHolder: "Select which build you would like to use" , ignoreFocusOut: true, title: "Render Type"},
    );
  }




  // Explorer entry points --------------------------------------------------

  /**
   * User selected .json command action
   * @param ctx obtained from vscode command on .zarr or .tif context menus
   */
  async function withOverlay(ctx: any){
    // TODO
    return
  }

  /**
   * User selected .zarr or .tif command action
   * @param ctx obtained from vscode command on .zarr or .tif context menus
   */
  async function withImage(ctx: any) {
    // Normalize path
    let path = ctx.fsPath.replace(/\\/g, '/');

    // path must be specified
    if (path === undefined) {
      return;
    } 
    
    // Trim path up to 1st .zarr if does not end in tif
    if (!path.endsWith("tif") && !path.endsWith("tiff")){
      let tokens = path.split(".zarr")
      let left = tokens[0]
      let rightTokens = tokens[1].split('/')
      path =  left + ".zarr" + rightTokens[0]
      console.log("broken up: " + path)
    }

    // Convert to interface
    if (isUrl(path)) {
      path = { url: path };
    } else {
      path = { path: path };
    }

    // Get overlay
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
        vscode.workspace.getConfiguration("prompt.default").get("static")
      ) {
        renderType = {
          label: "Static Build",
          description: "Bundled Polus Render",
          target: "static",
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


  // VSCode extension commands --------------------------------------------------
  let openZarr = vscode.commands.registerCommand(
    "polus-render.openZarr",
    async (ctx) => {
      withImage(ctx);
    },
  );

  let openTif = vscode.commands.registerCommand(
    "polus-render.openTif",
    async (ctx) => {
      withImage(ctx);
    },
  );

  let openJson = vscode.commands.registerCommand(
    "polus-render.openJson",
    async (ctx) => {
      withOverlay(ctx)
    }
  )

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
        if (renderType === undefined){
          return;
        }
        await buildRunRender(imageLocation, overlayLocation, renderType, context);
      },
    );

  context.subscriptions.push(customRender, openZarr, openTif, openJson);

  /* Status bar icon */
	let RenderItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	RenderItem.command = "polus-render.openPolusRender";
  RenderItem.text = "$(run) Polus Render"  /* No clear way for custom icons - https://github.com/microsoft/vscode/issues/72244 */
  RenderItem.tooltip = "Open Polus Render"
  context.subscriptions.push(RenderItem)

  RenderItem.show();
}


export function deactivate() {
  // Kill ports occupied by extension
  portsInUse.forEach((port)=>{
    exec(`kill $(lsof -t -i:${port})`, async function(err, stdout, stderr) {
      console.log(stdout)
    });
  })
}
