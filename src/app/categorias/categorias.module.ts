import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CategoriasPageRoutingModule } from './categorias-routing.module';
import { CategoriasPage } from './categorias.page';
@NgModule({ imports: [SharedModule, CategoriasPageRoutingModule], declarations: [CategoriasPage] })
export class CategoriasPageModule {}
