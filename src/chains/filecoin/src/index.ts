import {FilecoinOptions} from "@ganache/options";
import Emittery from "emittery";
import {types, utils, JsonRpcTypes, PromiEvent} from "@ganache/utils";
import FilecoinApi from "./api";
import Provider from "./provider";
import {RecognizedString, WebSocket, HttpRequest} from "uWebSockets.js";

export type FilecoinProvider = Provider;
export const FilecoinProvider = Provider;

export class FilecoinConnector extends Emittery.Typed<undefined, "ready" | "close"> 
  implements types.Connector<FilecoinApi, JsonRpcTypes.Request<FilecoinApi>> {
 
  #provider: FilecoinProvider;

  get provider() {
    return this.#provider;
  }

  constructor(providerOptions: FilecoinOptions = null, executor: utils.Executor) {
    super();

    const provider = this.#provider = new FilecoinProvider(providerOptions, executor);
    
    // tell the consumer (like a `ganache-core` server/connector) everything is ready
    provider.on("ready", () => {
      this.emit("ready");
    })
  }

  parse(message: Buffer) {
    return JSON.parse(message) as JsonRpcTypes.Request<FilecoinApi>;
  }

  // Note that if we allow Filecoin to support Websockets, ws-server.ts blows up.
  // TODO: Look into this.
  handle(payload: JsonRpcTypes.Request<FilecoinApi>, connection: HttpRequest /*| WebSocket*/): PromiEvent<any> {
    return new PromiEvent((resolve) => {
      return this.#provider.send(payload).then(resolve);
    });
  }

  format(result: any, payload: JsonRpcTypes.Request<FilecoinApi>): RecognizedString {
    const json = JsonRpcTypes.Response(payload.id, result);
    return JSON.stringify(json);
  }

  close(){
    this.provider.stop();
  }

}