import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DetallePageRoutingModule } from './detalle-routing.module';
import { DetallePage } from './detalle.page';
@NgModule({ imports: [SharedModule, DetallePageRoutingModule], declarations: [DetallePage] })
export class DetallePageModule {}
