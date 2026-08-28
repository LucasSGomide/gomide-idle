// VIOLATION fixture: a use case that constructs its own logger instead of having
// one injected (architecture-api.md rule 48). Never part of the app build.
import { Logger } from '@nestjs/common';

export class SealOfflineSessionUseCase {
  private readonly logger = new Logger(SealOfflineSessionUseCase.name);

  execute(): void {
    this.logger.log('sealing the offline session');
  }
}
