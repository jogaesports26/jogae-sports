import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CourtsModule } from './courts/courts.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PlayerAuthModule } from './player-auth/player-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CourtsModule,
    ReservationsModule,
    PlayerAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
