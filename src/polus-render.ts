import { exec, spawn } from "child_process";
import * as getPort from "get-port";
var path = require("path");



export interface URL {
  url: string;
}

export interface ServerURL extends URL{
  ports: number[];
}

export interface Path {
  path: string;
}

export interface PolusArgs {
  imageLocation: URL | Path;
  overlayLocation: URL | Path;
  useLocalRender: boolean;
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

  polusArgs: PolusArgs;

  public constructor(polusArgs: PolusArgs) {
    this.polusArgs = polusArgs;
  }

  /**
   * Launches localhost webserver
   * @param url Url to launch in local server. Do not surround with quotes
   * @param port Port number to run webserver, 0 for 1st available port.
   */
  private async launchServer(path: Path, port: number) {
    return new Promise<void>((resolve)=>{
    let process = spawn(`npx http-server --cors --port ${port} "${path.path}"`, {shell:true});
    process.stderr?.on('data', (data)=> {
      console.log(data.toString())
    })
    process.stdout?.on('data', (data)=> {
      console.log(data.toString())

      if (data.toString().indexOf('Need to install the following packages:') > -1){
        process.stdin?.write('y');
      }
      else if(data.toString().indexOf('Available on:') > -1){
      resolve();
      }
    });
  });

  }

  /**
   * Builds and launches servers needed for the Polus Render
   * parameters provided in the constructor.
   *
   * Returns: Polus Render's URL
   */
  public async render(context: any): Promise<ServerURL> {
    let imageLocation, overlayLocation, renderBase, tifExtension, overlayExtension;
    let ports = [];
    // Get imageLocation
    if ("url" in this.polusArgs.imageLocation) {
      imageLocation =
        this.polusArgs.imageLocation.url.length > 0
          ? `?imageUrl=${this.polusArgs.imageLocation.url}`
          : "";
      tifExtension = "";
    } else if (this.polusArgs.imageLocation.path.length > 0) {
      let port = await getPort();
      ports.push(port)
      console.log(JSON.stringify(this.polusArgs.imageLocation.path));
      if (path.extname(this.polusArgs.imageLocation.path) === ".tif") {
        tifExtension = path.basename(this.polusArgs.imageLocation.path);
        let dir = path.dirname(this.polusArgs.imageLocation.path);
        await this.launchServer({ path: dir }, port);
        imageLocation = `?imageUrl=http://localhost:${port}/`;
      } else {
        await this.launchServer(this.polusArgs.imageLocation, port);
        imageLocation = `?imageUrl=http://localhost:${port}/`;
        tifExtension = "";
      }
    } else {
      imageLocation = "";
      tifExtension = "";
    }

    // Get overlayLocation
    if ("url" in this.polusArgs.overlayLocation) {
      overlayLocation =
        this.polusArgs.overlayLocation.url.length > 0
          ? `&overlayUrl=${this.polusArgs.overlayLocation.url}`
          : "";
          overlayExtension = ""
    } else if (this.polusArgs.overlayLocation.path.length > 0) {
      overlayExtension =  path.basename(this.polusArgs.overlayLocation.path)
      let dir = path.dirname(this.polusArgs.overlayLocation.path);
      let port = await getPort();
      ports.push(port)
      await this.launchServer({path:dir}, port);
      overlayLocation = `&overlayUrl=http://localhost:${port}/`;
    } else {
      overlayLocation = "";
      overlayExtension = ""
    }

    // Check render type
    if (this.polusArgs.useLocalRender) {
      let port = await getPort();
      ports.push(port)
      console.log(context);
      await this.launchServer({ path: context }, port);
      renderBase = `http://localhost:${port}/`;
    } else {
      renderBase = "https://render.ci.ncats.io/";
    }

    // Build Render URL and return it
    console.log(
      `${renderBase}${imageLocation}${tifExtension}${overlayLocation}${overlayExtension}`,
    );
    return {
      url: `${renderBase}${imageLocation}${tifExtension}${overlayLocation}${overlayExtension}`,
      ports: ports
    };
  }
}
