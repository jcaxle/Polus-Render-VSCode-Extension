import * as getPort from "get-port";
import {Serve} from "./http-server"
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

  polusArgs: PolusArgs;

  /**
   * Inits Polus
   * @param polusArgs Info required for Polus Render
   */
  public constructor(polusArgs: PolusArgs) {
    this.polusArgs = polusArgs;
  }

  /**
   * Launches localhost webserver
   * @param path Path to serve
   * @param port Port number to run webserver, 0 for 1st available port.
   */
  private async launchServer(path: Path, port: number) {
    let server = new Serve(port)
    server.serve(path)
  }

  /**
   * Builds and launches servers needed for the Polus Render
   *
   * @param render Local build of render location
   * @returns Polus Render's URL
   */
  public async render(render: string): Promise<ServerURL> {
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
      if (path.extname(this.polusArgs.imageLocation.path) === ".tif" || path.extname(this.polusArgs.imageLocation.path) === ".tiff") {
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
      if (imageLocation.length == 0){
        overlayLocation = "?"
      }
      else{
        overlayLocation = "&"
      }
      overlayLocation += `overlayUrl=http://localhost:${port}/`;
    } else {
      overlayLocation = "";
      overlayExtension = ""
    }

    // Check render type
    if (this.polusArgs.useLocalRender) {
      let port = await getPort();
      ports.push(port)
      await this.launchServer({ path: render }, port);
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
