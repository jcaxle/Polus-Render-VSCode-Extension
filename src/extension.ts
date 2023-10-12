// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { InputBoxOptions } from 'vscode';
import {spawn} from 'child_process';
var path = require("path")


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	//console.log('Congratulations, your extension "polus-render" is now active!');

	let customRender = vscode.commands.registerCommand('polus-render.openCustomRender', async () => {
		let imageLocation = await vscode.window.showInputBox({title:"Enter Image URL", prompt:"Enter to submit URL, leave blank to skip, ESC to open file picker", placeHolder:"Zarr/Tif URL"});
        // File prompt if Undefined
        if (imageLocation === undefined){
            // User selects dataset type, due to limitations that file & folder can't be shown together
            let imageType = await vscode.window.showQuickPick([{label:"Zarr", description:"*.zarr", target:"zarr"},
	        {label:"Tif", description:"*.ome.tif", target:"tif"}], {placeHolder:"Select the extension type of your dataset"});
            
            if (imageType === undefined){ return; }

            let selectedFile:vscode.Uri[]|undefined;
            if(imageType.target === "zarr"){
                selectedFile = (await vscode.window.showOpenDialog({canSelectFolders:true, canSelectMany:false, title: "Select Image", openLabel: "Select Image", filters: {'Image': [imageType.target]}}));
            }
            else{
                selectedFile = (await vscode.window.showOpenDialog({canSelectFiles:true, canSelectMany:false, title: "Select Image", openLabel: "Select Image", filters: {'Image': [imageType.target]}}));
            }
            
            if (selectedFile) {
                imageLocation = selectedFile[0].fsPath;
            }
            // Since user cancelled both prompts, skip opening render
            else{
                return;
            }
        }

		let overlayLocation = await vscode.window.showInputBox({title:"Enter Overlay URL", prompt: "Enter to submit URL, leave blank to skip, ESC to open file picker", placeHolder:"MicroJSON URL"});
        // File prompt if Undefined
        if (overlayLocation === undefined){

            let selectedFile = (await vscode.window.showOpenDialog({canSelectFiles:true, canSelectMany:false, title: "Select Overlay", openLabel: "Select Overlay", filters: {'Overlay': ['json']}}));
            if (selectedFile) {
                overlayLocation = selectedFile[0].fsPath;
            }
            // Since user cancelled both prompts, skip opening render
            else{
                return;
            }
        }
        
        let renderType = await vscode.window.showQuickPick([{label:"Online Build", description:"https://render.ci.ncats.io/", target:"online"},
	{label:"Local Build", description:"Bundled Polus Render", target:"local"}], {placeHolder:"Select which build you would like to use"});

        vscode.window.showInformationMessage(imageLocation);
		// Fix undefined if it occurs and make args ready for spawn
		imageLocation = imageLocation.length > 0 ? imageLocation : imageLocation;
		overlayLocation = overlayLocation.length > 0 ? overlayLocation : overlayLocation;

		let typeFlag = "";
		if (renderType !== undefined && renderType.target === "online"){
			typeFlag = '-t';
		}
	let absPath = path.resolve("C:/Users/JeffChen/OneDrive - Axle Informatics/Documents/working/polus-render/src/polus-render-wrapper.py")

    // Build args
    let args = ['-d', absPath];
    if(imageLocation !== ""){ args.push("-i", imageLocation);} 
    if(overlayLocation !== ""){args.push("-o", overlayLocation);}
    if(typeFlag !== ""){args.push("-t");}
    
    
    console.log(JSON.stringify(args))
    let child = spawn('python', args);
	
	child.stdout.setEncoding('utf8');
	child.stdout.on('data',
        function (data) {
			vscode.window.showInformationMessage(data.toString());
            let panel = vscode.window.createWebviewPanel("render", "Render", vscode.ViewColumn.One, {enableScripts: true, localResourceRoots:[vscode.Uri.file('/')]});
            panel.webview.html = `
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
                <iframe src=${data.toString()}"
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
        });
	child.stderr.setEncoding('utf8');

	child.stderr.on('data',
        function (data) {
			vscode.window.showErrorMessage(data.toString());
        });	//vscode.window.showInformationMessage("Has finished running");

	child.on('close', function(code) {
			//Here you can get the exit code of the script
		
			vscode.window.showInformationMessage("Polus Render has closed with code: " + code?.toString());
		});

	});

	
	context.subscriptions.push(customRender);
}


// This method is called when your extension is deactivated
export function deactivate() {}
