import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MovimientosPageRoutingModule } from './movimientos-routing.module';
import { MovimientosPage } from './movimientos.page';
@NgModule({ imports: [SharedModule, MovimientosPageRoutingModule], declarations: [MovimientosPage] })
export class MovimientosPageModule {}
