import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { UpsertPriceRulesDto } from './dto/upsert-price-rule.dto';
import { UpsertRecurringMaintenanceBlocksDto } from './dto/upsert-recurring-maintenance-block.dto';

@Controller('courts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.courtsService.findAllByOwner(user.sub);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourtDto) {
    return this.courtsService.create(user.sub, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.courtsService.findOneOrThrow(id, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.courtsService.remove(id, user.sub);
  }

  @Put(':id/price-rules')
  replacePriceRules(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertPriceRulesDto,
  ) {
    return this.courtsService.replacePriceRules(id, user.sub, dto);
  }

  @Put(':id/recurring-maintenance-blocks')
  replaceRecurringMaintenanceBlocks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertRecurringMaintenanceBlocksDto,
  ) {
    return this.courtsService.replaceRecurringMaintenanceBlocks(
      id,
      user.sub,
      dto,
    );
  }
}
