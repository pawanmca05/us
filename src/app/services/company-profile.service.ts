import { Injectable } from '@angular/core';
import {HttpHeaders,HttpClient} from '@angular/common/http'
import {Observable} from 'rxjs';

const API_KEY = 'XYZW51VA7TJHAM2X';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {

  constructor(private _httpClient:HttpClient) { }

  getCompanyProfile(val:string):Observable<any>{
    return this._httpClient.get<Observable<any>>(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${val}&apikey=${API_KEY}`
    );
  }

  getIntradaySeries(symbol:string): Observable<any> {
    return this._httpClient.get<any>(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&outputsize=compact&apikey=${API_KEY}`
    );
  }

  getDailyAdjustedSeries(symbol:string): Observable<any> {
    return this._httpClient.get<any>(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`
    );
  }

  getDailySeries(symbol:string): Observable<any> {
    return this._httpClient.get<any>(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`
    );
  }

  getCompanyList():Observable<any[]> {
    let headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    return this._httpClient.get<any[]>('assets/companyNames.json',{headers});
  }
}
