import { Injectable } from '@angular/core';
import {HttpHeaders,HttpClient} from '@angular/common/http'
import {Observable} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {

  constructor(private _httpClient:HttpClient) { }

   getCompanyProfile(val:string):Observable<any>{
      return this._httpClient.get<Observable<any>>('https://www.alphavantage.co/query?function=OVERVIEW&symbol='+val+'&apikey=XYZW51VA7TJHAM2X');
   }
   getCompanyList():Observable<any[]> {
    let headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');

    return this._httpClient.get<any[]>('assets/companyNames.json',{headers});
}
}
