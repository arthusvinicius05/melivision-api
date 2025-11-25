import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { MercadolibreService } from './mercadolibre.service';
import { SitesController } from './controllers/sites.controller';
import { LocationsController } from './controllers/locations.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ItemsController } from './controllers/items.controller';
import { SearchController } from './controllers/search.controller';
import { UsersController } from './controllers/users.controller';
import { OrdersController } from './controllers/orders.controller';
import { MessagesController } from './controllers/messages.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { AttributesController } from './controllers/attributes.controller';
import { BrandsController } from './controllers/brands.controller';
import { TrendsController } from './controllers/trends.controller';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [
    SitesController,
    LocationsController,
    CategoriesController,
    ItemsController,
    SearchController,
    UsersController,
    OrdersController,
    MessagesController,
    CurrenciesController,
    AttributesController,
    BrandsController,
    TrendsController,
  ],
  providers: [MercadolibreService],
  exports: [MercadolibreService],
})
export class MercadolibreModule {}
