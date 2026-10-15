import { Component, OnInit } from '@angular/core';
import { SheetsService } from './services/sheets.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private readonly sheets: SheetsService) {}

  async ngOnInit(): Promise<void> {
    await this.sheets.init();
  }
}
