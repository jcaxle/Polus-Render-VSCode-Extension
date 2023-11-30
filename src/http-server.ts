import handler = require("serve-handler")
import http = require('http');
import {Path} from './polus-render'

/**
 * HTTP-server implemented with serve-handler. 
 */
export class Serve{
  port:number

    /**
     * Inits server
     * @param port Port to use
     */
    public constructor(port:number) {
        this.port = port;
    }

    /**
     * Serve file at specified path
     * @param path: Path to serve on
     */
    serve(path:Path){
        console.log("Serving: " + path)
        const server = http.createServer((request, response) => {
          response.setHeader(
            'Access-Control-Allow-Origin', '*', 
          );
            return handler(request, response, {"public":path.path});
          });
          
          server.listen(this.port, () => {
            console.log('Running at http://localhost:3000');
          });
          
    }
}
