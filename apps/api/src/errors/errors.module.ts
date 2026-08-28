import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from './all-exceptions.filter.js';

// Global so a gateway can name AllExceptionsFilter in @UseFilters — NestJS's
// default WS handling emits its own `exception` event otherwise, bypassing the
// normalised shape (architecture-api.md rule 45).
@Global()
@Module({
  providers: [
    AllExceptionsFilter,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [AllExceptionsFilter],
})
export class ErrorsModule {}
