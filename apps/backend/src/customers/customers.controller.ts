import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { UpdateBirthDateDto } from './dto/update-birth-date.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.listCustomers(user.sub);
  }

  @Get(':phone')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('phone') phone: string,
  ) {
    return this.customersService.getCustomerHistory(user.sub, phone);
  }

  @Patch(':playerId/birth-date')
  updateBirthDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateBirthDateDto,
  ) {
    return this.customersService.updateBirthDate(
      user.sub,
      playerId,
      dto.birthDate,
    );
  }
}
