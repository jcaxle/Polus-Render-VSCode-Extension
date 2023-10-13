import { exec } from "child_process";
import * as vscode from "vscode";
import * as getPort from 'get-port';
import * as path from "path";

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
export class Polus {
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
     * @param url Url to launch in local server. Do not surround with quotes
     * @param port Port number to run webserver, 0 for 1st available port.
     */
    private launchServer(path:Path, port:number){
        exec(`npx http-server --cors --port ${port} "${path.path}"`);
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
            imageLocation = this.polusArgs.imageLocation.url.length > 0 ?`?imageUrl=${this.polusArgs.imageLocation.url}` : "";
            tifExtension = "";
        }
        else if(this.polusArgs.imageLocation.path.length > 0){
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
        else{
            imageLocation = "";
            tifExtension = "";
        }
        
        // Get overlayLocation
        if ('url' in this.polusArgs.overlayLocation){
            overlayLocation = this.polusArgs.overlayLocation.url.length > 0 ?`&overlayUrl=${this.polusArgs.overlayLocation.url}` : "";
            jsonExtension = "";
        }
        else if(this.polusArgs.overlayLocation.path.length > 0){
            let port = await getPort();
            this.launchServer(this.polusArgs.overlayLocation, port);
            overlayLocation = `&overlayUrl=http://localhost:${port}/`;
            jsonExtension = path.basename(this.polusArgs.overlayLocation.path);
        }
        else{
            overlayLocation = "";
            jsonExtension = "";
        }

        // Check render type
        if(this.polusArgs.useLocalRender){
            let port = await getPort();
            this.launchServer({path:"C:/Users/JeffChen/OneDrive - Axle Informatics/Documents/working/polus-render/src/polus-render/src/apps/render-ui/"}, port);
            renderBase = `http://localhost:${port}/`;
        }
        else{
            renderBase = "https://render.ci.ncats.io/";
        }

        // Build Render URL and return it
        return {url:`${renderBase}${imageLocation}${tifExtension}${overlayLocation}${jsonExtension}`};
    }
}