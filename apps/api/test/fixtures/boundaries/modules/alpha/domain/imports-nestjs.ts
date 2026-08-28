// VIOLATION fixture: a NestJS import inside domain/ (architecture-api rule 20).
import { Injectable } from '@nestjs/common';

@Injectable()
export class Leaky {}
