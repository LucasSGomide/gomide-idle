// Allowed: transport/ is the one folder that may import the socket library.
import { io } from 'socket.io-client';
export const socket = io();
