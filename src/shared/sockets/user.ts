import { ISocketData, IUserDocument } from "@user/interfaces/user.interface";
import { Server, Socket } from "socket.io";

export let socketIOUserObject: Server;
export class SocketIOUserHandler {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketIOUserObject = io;
  }
  public listen(): void {
    this.io.on("connection", (socket: Socket) => {
      this.io.on("block user", (data: ISocketData) => {
        this.io.emit("blocked user id", data);
      });
      this.io.on("unblock user", (data: ISocketData) => {
        this.io.emit("unblock user id", data);
      });
    });
  }
}
