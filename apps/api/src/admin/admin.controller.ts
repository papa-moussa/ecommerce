import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';

import { AuditResource } from '../common/decorators/audit-resource.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';

import { AdminService } from './admin.service';
import { AddProductImageDto } from './dto/add-product-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListEmailLogsDto } from './dto/list-email-logs.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Roles('ADMIN')
@UseInterceptors(AuditLogInterceptor)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  @Get('metrics/overview')
  getMetricsOverview(@Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.adminService.getMetricsOverview(period);
  }

  @Get('metrics/timeseries')
  getMetricsTimeseries(
    // SEC-016: narrow types so ValidationPipe rejects anything not in the union
    @Query('metric') metric: 'revenue' | 'orders' = 'revenue',
    @Query('period') period: '7d' | '30d' | '90d' = '30d',
  ) {
    return this.adminService.getMetricsTimeseries(metric, period);
  }

  @Get('metrics/low-stock')
  getLowStockProducts() {
    return this.adminService.getLowStockProducts();
  }

  // ---------------------------------------------------------------------------
  // Uploads
  // ---------------------------------------------------------------------------

  @Post('uploads/sign')
  @HttpCode(HttpStatus.OK)
  @AuditResource({ resource: 'upload', action: 'upload.sign' })
  signUpload(@Body('folder') folder: string) {
    return this.adminService.signUpload(folder);
  }

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  @Get('products')
  listProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.listProducts({ q, category, page: page ? parseInt(page, 10) : 1 });
  }

  @Post('products')
  @AuditResource({ resource: 'product', action: 'product.create' })
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: { id: string }) {
    return this.adminService.createProduct(dto, user.id);
  }

  @Patch('products/:id')
  @AuditResource({ resource: 'product', action: 'product.update', idParam: 'id' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @AuditResource({ resource: 'product', action: 'product.delete', idParam: 'id' })
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Post('products/:id/images')
  @AuditResource({ resource: 'product.image', action: 'product.image.add', idParam: 'id' })
  addProductImage(@Param('id') id: string, @Body() dto: AddProductImageDto) {
    return this.adminService.addProductImage(id, dto);
  }

  // HIGH-06 (Audit-2): typed DTO with @ArrayMaxSize(100) replaces bare string[]
  @Patch('products/:id/images/reorder')
  @AuditResource({ resource: 'product.image', action: 'product.image.reorder', idParam: 'id' })
  reorderProductImages(@Param('id') id: string, @Body() dto: ReorderImagesDto) {
    return this.adminService.reorderProductImages(id, dto.ids);
  }

  @Delete('products/:id/images/:imageId')
  @AuditResource({ resource: 'product.image', action: 'product.image.delete', idParam: 'id' })
  deleteProductImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.adminService.deleteProductImage(id, imageId);
  }

  @Post('products/:id/stock')
  @AuditResource({ resource: 'product.stock', action: 'product.stock.adjust', idParam: 'id' })
  adjustStock(
    @Param('id') id: string,
    @Body() dto: StockAdjustmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.adjustStock(id, dto, user.id);
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.listOrders({ status, from, to, page: page ? parseInt(page, 10) : 1 });
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  // MED-01 (Audit-2): typed DTO replaces @Query() query: any
  @Get('email-logs')
  listEmailLogs(@Query() query: ListEmailLogsDto) {
    return this.adminService.listEmailLogs(query);
  }

  @Patch('orders/:id/status')
  @AuditResource({ resource: 'order', action: 'order.status.update', idParam: 'id' })
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  @Post('orders/:id/refund')
  @HttpCode(HttpStatus.OK)
  @AuditResource({ resource: 'order', action: 'order.refund', idParam: 'id' })
  refundOrder(@Param('id') id: string, @Body() dto: RefundOrderDto) {
    return this.adminService.refundOrder(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  @Get('users')
  listUsers(@Query('q') q?: string, @Query('role') role?: string, @Query('page') page?: string) {
    return this.adminService.listUsers({ q, role, page: page ? parseInt(page, 10) : 1 });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @AuditResource({ resource: 'user', action: 'user.update', idParam: 'id' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  @Get('audit-log')
  listAuditLogs(
    @Query('userId') userId?: string,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.listAuditLogs({
      userId,
      resource,
      action,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
    });
  }
}
