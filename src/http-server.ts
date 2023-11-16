import handler = require("serve-handler")
import http = require('http');
import {Path} from './polus-render'

export class Serve{
    port:number
    public constructor(port:number) {
        this.port = port;
    }

    serve(path:Path){
        console.log("Serving: " + path)
        const server = http.createServer((request, response) => {
          response.setHeader(
            'Access-Control-Allow-Origin', '*', /* @dev First, read about security */
            /** add other headers as per requirement */
          );
            // You pass two more arguments for config and middleware
            // More details here: https://github.com/vercel/serve-handler#options
            return handler(request, response, {"public":path.path});
          });
          
          server.listen(this.port, () => {
            console.log('Running at http://localhost:3000');
          });
          
    }
}
