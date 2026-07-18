import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import {CompanyProfileService} from '../services/company-profile.service';
import {FormControl} from '@angular/forms';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-company-profile',
  standalone: false,
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.css']
})
export class CompanyProfileComponent implements OnInit {

    userData: any[] = [];
    profile: any;
    keyword = 'Name';
    isProfile:boolean=false;
    selectedCompanyName = '';
    marketStatus = 'MARKET CLOSED';
    marketExchange = 'NASDAQ';
    @ViewChild('priceChart') priceChart!: ElementRef<HTMLCanvasElement>;
    private chart: any = null;
    currentTimeframe: string = '5Y';
    displayedPrice: number | null = null;
    chartErrorMessage: string | null = null;

  constructor(
    private _companyProfileService:CompanyProfileService,
    private _cdRef: ChangeDetectorRef
  ) { }
  myControl = new FormControl();
  options: any[] = [];

  ngOnInit(): void {
    // register chart.js components
    Chart.register(...registerables);
    // initial profile load (empty)
    this._companyProfileService.getCompanyProfile('').subscribe(data=>{
      this.profile = data;
      this.updateMarketStatus();
    });

    // Optionally preload some items
    this._companyProfileService.getCompanyList().subscribe(
      data => {
        this.options = data.slice(0,10);
      },
      error => {
        console.log("Something wrong here");
      });

    // Listen to value changes if you want to react to typing
    // (not required because template passes value to onChangeSearch)
  }

  selectEvent(item: any) {
    this.isProfile=false;
    if (!item) { return; }
    this.selectedCompanyName = item.Name || item.name || '';
    this.myControl.setValue(this.selectedCompanyName);
    const code = item.Code || item.code || item.Symbol || item.Symbol;
    // Try to use Code property; if missing pass whole item
    const handleProfile = (data: any) => {
      this.profile = data;
      this.isProfile = !!data;
      this.mapProfileFields();
      this.updateMarketStatus();
      if (this.profile?.Symbol) {
        this.chartErrorMessage = null;
        this._cdRef.detectChanges();
        setTimeout(() => this.loadPriceSeries(this.profile.Symbol, this.currentTimeframe), 0);
      }
    };

    if (item.Code) {
      this._companyProfileService.getCompanyProfile(item.Code).subscribe(handleProfile);
    } else {
      this._companyProfileService.getCompanyProfile(code).subscribe(handleProfile);
    }
  }

  private renderChart(labels: string[], data: number[]){
    try{
      if(!this.priceChart || !this.priceChart.nativeElement) {
        this.chartErrorMessage = 'Chart canvas not ready yet. Please try again.';
        return;
      }
      const ctx = this.priceChart.nativeElement.getContext('2d');
      if(this.chart){ this.chart.destroy(); this.chart = null; }
      this.chart = new Chart(ctx as any, {
        type: 'line',
        data: {
          labels,
          datasets:[{ label: 'Price', data, borderColor: '#00a078', backgroundColor: 'rgba(0,160,120,0.08)', tension:0.25, pointRadius:2, fill:'start' }]
        },
        options: {
          responsive:true,
          plugins:{
            legend:{display:false},
            tooltip: {
              callbacks: {
                label: (ctx2:any) => {
                  const v = ctx2.parsed.y;
                  return 'Price: $' + (v!=null ? v.toLocaleString(undefined,{maximumFractionDigits:2}) : v);
                }
              }
            }
          },
          scales:{ x:{ display:true }, y:{ display:true } },
          interaction: { mode: 'index', intersect: false }
        }
      });
      if(data && data.length) {
        this.displayedPrice = data[data.length-1];
      }
    }catch(e){ console.error('Chart render error',e); }
  }

  setTimeframe(tf: string){
    this.currentTimeframe = tf;
    if(this.profile?.Symbol){
      this.chartErrorMessage = null;
      this._cdRef.detectChanges();
      setTimeout(() => this.loadPriceSeries(this.profile.Symbol, tf), 0);
    }
  }

  private loadPriceSeries(symbol: string, timeframe: string){
    if(timeframe === '1D'){
      this._companyProfileService.getIntradaySeries(symbol).subscribe(
        resp => {
          if (resp?.['Error Message']) {
            this.chartErrorMessage = resp['Error Message'];
            return;
          }
          if (resp?.Note) {
            this.chartErrorMessage = 'API limit reached. Please wait a moment and try again.';
            return;
          }
          const series = resp['Time Series (60min)'];
          if(!series) {
            this.chartErrorMessage = 'No intraday data available for this symbol.';
            return;
          }
        const points = Object.keys(series).sort();
        const slice = points.slice(-24);
        const labels = slice.map(ts => new Date(ts).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}));
        const data = slice.map(ts => Number(series[ts]['4. close']));
        if (!data.length || data.every(v => Number.isNaN(v))) {
          this.chartErrorMessage = 'No valid intraday price data available for this symbol.';
          return;
        }
        this.chartErrorMessage = null;
        this.renderChart(labels, data);
      });
    } else {
      this._companyProfileService.getDailyAdjustedSeries(symbol).subscribe(
        resp => {
          if (resp?.['Error Message']) {
            this.chartErrorMessage = resp['Error Message'];
            return;
          }
          if (resp?.Note) {
            this.chartErrorMessage = 'API limit reached. Please wait a moment and try again.';
            return;
          }
          const series = resp['Time Series (Daily)'];
          if(!series) {
            // Fallback to non-adjusted daily series when adjusted data is missing.
            this._companyProfileService.getDailySeries(symbol).subscribe(
              fallback => {
                if (fallback?.['Error Message']) {
                  this.chartErrorMessage = fallback['Error Message'];
                  return;
                }
                if (fallback?.Note) {
                  this.chartErrorMessage = 'API limit reached. Please wait a moment and try again.';
                  return;
                }
                const fallbackSeries = fallback['Time Series (Daily)'];
                if(!fallbackSeries) {
                  this.chartErrorMessage = 'No daily series data available for this symbol.';
                  return;
                }
                this.renderDailySeries(fallbackSeries, timeframe);
              }, error => {
                console.error('Daily series fallback error', error);
                this.chartErrorMessage = 'Unable to load daily chart data.';
              });
            return;
          }
          this.renderDailySeries(series, timeframe);
        }, error => {
          console.error('Daily series error', error);
          this.chartErrorMessage = 'Unable to load daily chart data.';
        });
    }
  }

  private renderDailySeries(series: any, timeframe: string) {
    const keys = Object.keys(series).sort();
    let count = 30;
    if(timeframe === '1W') count = 7;
    else if(timeframe === '1M') count = 30;
    else if(timeframe === '3M') count = 90;
    else if(timeframe === '6M') count = 180;
    else if(timeframe === '1Y') count = 252;
    else if(timeframe === '3Y') count = 252 * 3;
    else if(timeframe === '5Y') count = 252 * 5;
    const slice = keys.slice(-count);
    const labels = slice.map(ts => new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'}));
    const data = slice.map(ts => Number(series[ts]['4. close']));
    if (!data.length || data.every(v => Number.isNaN(v))) {
      this.chartErrorMessage = 'No valid daily price data available for this symbol.';
      return;
    }
    this.chartErrorMessage = null;
    this.renderChart(labels, data);
  }

  onChangeSearch(val: string) {
    if (!val) {
      this.options = [];
      return;
    }

    if(val.length>=3){
      this._companyProfileService.getCompanyList().subscribe(
        data => {
          // update and filter locally for faster UX
          this.options = data.filter(d => d.Name && d.Name.toLowerCase().includes(val.toLowerCase()));
        },
        error => {
          console.log("Something wrong here");
        });
    } else {
      this.options = [];
    }
  }
  
  onFocused(e: any){
    // do something when input is focused
  }

  formatMarketCap(value: any): string {
    const num = Number(value);
    if (!num || isNaN(num)) {
      return '$0.00B';
    }
    const billions = num / 1_000_000_000;
    return '$' + billions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'B';
  }

  private updateMarketStatus(){
    this.marketExchange = this.profile?.Exchange || 'NASDAQ';
    try{
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', weekday: 'long' }).formatToParts(new Date());
      const values: any = {};
      parts.forEach(part => { if(part.type !== 'literal') { values[part.type] = part.value; }});
      const hour = Number(values.hour || '0');
      const minute = Number(values.minute || '0');
      const weekday = values.weekday || '';
      const isWeekday = ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(weekday);
      const minutesOfDay = hour * 60 + minute;
      const marketOpen = isWeekday && minutesOfDay >= (9 * 60 + 30) && minutesOfDay < (16 * 60);
      this.marketStatus = marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED';
    } catch (e) {
      this.marketStatus = 'MARKET CLOSED';
    }
  }

  private mapProfileFields(){
    if (!this.profile) { return; }
    for(var key in this.profile) {
      if(key=="52WeekHigh"){
        this.profile.WeekHigh52=this.profile[key];
      }
      if(key=="52WeekLow"){
        this.profile.WeekLow52=this.profile[key];
      }
      if(key=="50DayMovingAverage"){
        this.profile.DayMovingAverage50=this.profile[key];
      }
      if(key=="200DayMovingAverage"){
        this.profile.DayMovingAverage200=this.profile[key];
      }
    }
  }

}
