import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CategoriaDetallePageRoutingModule } from './categoria-detalle-routing.module';
import { CategoriaDetallePage } from './categoria-detalle.page';

@NgModule({
  imports: [SharedModule, CategoriaDetallePageRoutingModule],
  declarations: [CategoriaDetallePage],
})
export class CategoriaDetallePageModule {}
