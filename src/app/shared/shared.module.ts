import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular/lazy';
import { MonedaPipe } from '../pipes/moneda.pipe';

@NgModule({
  declarations: [MonedaPipe],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  exports: [CommonModule, FormsModule, IonicModule, RouterModule, MonedaPipe],
})
export class SharedModule {}
