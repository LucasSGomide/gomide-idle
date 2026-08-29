// Breaks socket-io-only-in-transport: Socket.IO imported outside transport/.
import { io } from 'socket.io-client';
export const socket = io();
