import { spawn } from "child_process";
import * as vscode from "vscode";
import getPort from 'get-port';
var path = require('path');

export interface URL {
    url:string;
}

export interface Path {
    path:string
}

export interface PolusArgs {
    imageLocation:URL|Path,
    overlayLocation:URL|Path,
    useLocalRender:boolean
}

/**
 * Variant of polus-render Pypi package for use in VSCode Extension.
 * Has the same functionality as polus-render; however, will only launch 
 * local file servers and does not build and embed IFrames.
 */
export default class Polus {
    /**
     * Constructor which accepts arguments used for Polus Render
     * @param imageLocation : 
     * @param overlayLocation 
     * @param useOnline 
     */

    polusArgs:PolusArgs;

    public constructor(polusArgs:PolusArgs){
        this.polusArgs = polusArgs;
    }

    
    /**
     * Launches localhost webserver
     * @param url Url to launch in local server.
     * @param port Port number to run webserver, 0 for 1st available port.
     */
    private launchServer(path:Path, port:number){
        let child = spawn("npx", ["http-server", "--cors=\'*\'", "--port", port.toString(), path.path]);
        child.stderr.setEncoding("utf8");

        child.stderr.on("data", function (data) {
            vscode.window.showErrorMessage(data.toString());
        }); //vscode.window.showInformationMessage("Has finished running");
      
        child.on("close", function (code) {
          //Here you can get the exit code of the script
          vscode.window.showInformationMessage(
            "http-server closed with code: : " + code?.toString(),
          );
        });
    }


    /**
     * Builds and launches servers needed for the Polus Render 
     * parameters provided in the constructor. 
     * 
     * Returns: Polus Render's URL
     */
    public async render(): Promise<URL>{
        let imageLocation, tifExtension, overlayLocation, renderBase, jsonExtension;

        // Get imageLocation
        if ('url' in this.polusArgs.imageLocation){
            imageLocation = `?imageUrl=${this.polusArgs.imageLocation.url}`;
        }
        else{
            let port = await getPort();
            this.launchServer(this.polusArgs.imageLocation, port);
            imageLocation = `?imageUrl=http://localhost:${port}/`;

            if(this.polusArgs.imageLocation.path.endsWith("tif")){
                tifExtension = path.basename(this.polusArgs.imageLocation.path);
            }
            else{
                tifExtension = "";
            }

        }
        
        // Get overlayLocation
        if ('url' in this.polusArgs.overlayLocation){
            overlayLocation = `&overlayUrl=${this.polusArgs.overlayLocation.url}`;
            jsonExtension = "";
        }
        else{
            let port = await getPort();
            this.launchServer(this.polusArgs.overlayLocation, port);
            overlayLocation = `&overlayUrl=http://localhost:${port}/`;

            jsonExtension = path.basename(this.polusArgs.overlayLocation.path);
        }

        // Check render type
        if(this.polusArgs.useLocalRender){
            let port = await getPort();
            this.launchServer({path:"apps/render-ui"}, port);
            renderBase = `http://localhost:${port}/`;
        }
        else{
            renderBase = "https://render.ci.ncats.io/";
        }

        // Build Render URL and return it
        return {url:`${renderBase}${imageLocation}${tifExtension}${overlayLocation}${jsonExtension}`};
    }
}