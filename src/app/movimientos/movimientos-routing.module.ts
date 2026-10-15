import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovimientosPage } from './movimientos.page';
const routes: Routes = [{ path: '', component: MovimientosPage }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MovimientosPageRoutingModule {}
