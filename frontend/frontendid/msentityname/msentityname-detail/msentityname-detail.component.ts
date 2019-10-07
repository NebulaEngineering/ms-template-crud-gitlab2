////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  FormBuilder
} from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';

////////// RXJS ///////////
import { map, mergeMap, tap, takeUntil, take } from 'rxjs/operators';
import { Subject, of} from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import { MatSnackBar } from '@angular/material';

//////////// i18n ////////////
import { TranslateService } from '@ngx-translate/core';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';

//////////// Other Services ////////////
import { msentitypascalDetailService } from './msentityname-detail.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'msentityname',
  templateUrl: './msentityname-detail.component.html',
  styleUrls: ['./msentityname-detail.component.scss']
})
// tslint:disable-next-line:class-name
export class msentitypascalDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  pageType: string;

  msentitycamel: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private msentitypascalDetailService: msentitypascalDetailService,
    private route: ActivatedRoute
  ) {
      this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.loadmsentitycamel();
  }

  loadmsentitycamel(){
    this.route.params
    .pipe(
      map(params => params['id']),
      mergeMap(entityId => entityId !== 'new' ?
        this.msentitypascalDetailService.getmsnamepascalmsentitypascal$(entityId).pipe(
          map(res => res.data.msnamepascalmsentitypascal)
        ) : of(null)
      ),
      takeUntil(this.ngUnsubscribe)
    ).subscribe((msentitycamel: any) => 
    {
      this.msentitycamel = msentitycamel;
      this.pageType = (msentitycamel && msentitycamel._id) ? 'edit' : 'new'
    }, 
    e => console.log(e));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
