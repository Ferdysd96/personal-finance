import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoriasPage } from './categorias.page';

const routes: Routes = [
  { path: '', component: CategoriasPage },
  {
    path: 'detalle/:nombre',
    loadChildren: () =>
      import('./categoria-detalle/categoria-detalle.module').then(
        (m) => m.CategoriaDetallePageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoriasPageRoutingModule {}