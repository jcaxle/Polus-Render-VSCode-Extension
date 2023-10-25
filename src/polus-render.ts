import { exec } from "child_process";
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
  private launchServer(path: Path, port: number) {
    exec(`npx http-server --cors --port ${port} "${path.path}"`, function (error, stdout, stderr) {
      console.log(stdout);
    });

  }

  /**
   * Builds and launches servers needed for the Polus Render
   * parameters provided in the constructor.
   *
   * Returns: Polus Render's URL
   */
  public async render(context: any): Promise<ServerURL> {
    let imageLocation, overlayLocation, renderBase, tifExtension;
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
        this.launchServer({ path: dir }, port);
        imageLocation = `?imageUrl=http://localhost:${port}/`;
      } else {
        this.launchServer(this.polusArgs.imageLocation, port);
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
    } else if (this.polusArgs.overlayLocation.path.length > 0) {
      let port = await getPort();
      ports.push(port)
      this.launchServer(this.polusArgs.overlayLocation, port);
      overlayLocation = `&overlayUrl=http://localhost:${port}/`;
    } else {
      overlayLocation = "";
    }

    // Check render type
    if (this.polusArgs.useLocalRender) {
      let port = await getPort();
      ports.push(port)
      console.log(context);
      this.launchServer({ path: context }, port);
      renderBase = `http://localhost:${port}/`;
    } else {
      renderBase = "https://render.ci.ncats.io/";
    }

    // Build Render URL and return it
    console.log(
      `${renderBase}${imageLocation}${tifExtension}${overlayLocation}`,
    );
    return {
      url: `${renderBase}${imageLocation}${tifExtension}${overlayLocation}`,
      ports: ports
    };
  }
}
