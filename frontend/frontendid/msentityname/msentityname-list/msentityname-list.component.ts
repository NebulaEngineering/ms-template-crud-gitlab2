////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";

import { Router, ActivatedRoute } from "@angular/router";

////////// RXJS ///////////
import {
  map,
  mergeMap,
  switchMap,
  toArray,
  filter,
  tap,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  take
} from "rxjs/operators";

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest } from "rxjs";

////////// ANGULAR MATERIAL //////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar,
  MatDialog
} from "@angular/material";
import { fuseAnimations } from "../../../../core/animations";

//////////// i18n ////////////
import {
  TranslateService,
  LangChangeEvent,
  TranslationChangeEvent
} from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";

///////// DATEPICKER //////////
import { MAT_MOMENT_DATE_FORMATS } from "./my-date-format";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MomentDateAdapter
} from "@coachcare/datepicker";

import * as moment from "moment";

//////////// Other Services ////////////
import { KeycloakService } from "keycloak-angular";
import { msentitypascalListService } from './msentityname-list.service';
import { ToolbarService } from "../../../toolbar/toolbar.service";

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'msentityname',
  templateUrl: './msentityname-list.component.html',
  styleUrls: ['./msentityname-list.component.scss'],
  animations: fuseAnimations,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: "es" },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS }
  ]
})
export class msentitypascalListComponent implements OnInit, OnDestroy {
  //Subject to unsubscribe 
  private ngUnsubscribe = new Subject();

  //////// FORMS //////////
  filterForm: FormGroup;
  

  /////// TABLE /////////

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  tableSize: number;
  tablePage = 0;
  tableCount = 25;

  // Columns to show in the table
  displayedColumns = [
    "name",
    "enabled",
    "creationTimestamp",
    "creatorUser",
    "modificationTimestamp",
    "modifierUser"
  ];

  /////// OTHERS ///////

  selectedmsentitypascal: any = null;

  constructor(    
    private formBuilder: FormBuilder,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private keycloakService: KeycloakService,
    private adapter: DateAdapter<any>,
    private msentitypascalListservice: msentitypascalListService,
    private toolbarService: ToolbarService,
    private dialog: MatDialog
  ) {    
      this.translationLoader.loadTranslations(english, spanish);
  }
    

  ngOnInit() {
    this.onLangChange();
    this.buildFilterForm();  
    this.updateFilterDataSubscription();
    this.updatePaginatorDataSubscription();
    this.loadLastFilters();
    this.refreshTableSubscription();
  }

  /**
   * Changes the internationalization of the dateTimePicker component
   */
  onLangChange() {
    this.translate.onLangChange
      .pipe(
        startWith({ lang: this.translate.currentLang }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(event => {
        if (event) {
          this.adapter.setLocale(event.lang);
        }
      });
  }

  /**
   * Emits the filter form data when it changes
   */
  listenFilterFormChanges$() {
    return this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    );
  }

  /**
   * Emits the paginator data when it changes   
   */
  listenPaginatorChanges$() {
    return this.paginator.page;
  }

  /**
   * Builds filter form
   */
  buildFilterForm() {
    // Reactive Filter Form
    this.filterForm = this.formBuilder.group({
      name: [null],
      creationTimestamp: [null],
      creatorUser: [null],      
      //modificationDate: [null],
      //modifierUser: [null],
    });

    this.filterForm.disable({
      onlySelf: true,
      emitEvent: false
    });
  }

  updateFilterDataSubscription() {
    this.listenFilterFormChanges$()
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(filterData => {
        // If the filters are modified, we have to reset the page of the table
        this.paginator.firstPage();
        this.msentitypascalListservice.updateFilterData(filterData);
      });
  }

  updatePaginatorDataSubscription() {
    this.listenPaginatorChanges$()
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(pagination => {
        const paginator = {
          pagination: {
            page: pagination.pageIndex, count: pagination.pageSize, sort: -1
          },
        };
        this.msentitypascalListservice.updatePaginatorData(paginator);
      });
  }

  /**
   * First time that the page is loading is needed to check if there were filters applied previously to load this info into the forms
   */
  loadLastFilters() {
    combineLatest(
      this.msentitypascalListservice.filter$,
      this.msentitypascalListservice.paginator$
    ).pipe(
      take(1)
    ).subscribe(([filter, paginator]) => {
          if (filter) {
            this.filterForm.patchValue({
              name: filter.name,
              creationTimestamp: filter.creationTimestamp,
              creatorUser: filter.creatorUser
            });
          }

          if (paginator) {
            this.tablePage = paginator.pagination.page;
            this.tableCount = paginator.pagination.count;
          }
        

        this.filterForm.enable({ emitEvent: true });
      });
  }
  
  /**
   * If a change is detect in the filter or the paginator then the table will be refreshed according to the values emmited
   */
  refreshTableSubscription() {
    combineLatest(
      this.msentitypascalListservice.filter$,
      this.msentitypascalListservice.paginator$,
    ).pipe(
      debounceTime(500),
      filter(([filter, paginator]) => (filter != null && paginator != null)),
      map(([filter, paginator]) => {
        if( filter.creationTimestamp){
          filter.creationTimestamp.set({hour:0,minute:0,second:0,millisecond:0});
        }
        const filterInput = {
          name: filter.name,
          creatorUser: filter.creatorUser,
          creationTimestamp: filter.creationTimestamp ? filter.creationTimestamp.valueOf() : null
        };
        const paginationInput = {
          page: paginator.pagination.page,
          count: paginator.pagination.count,
          sort: paginator.pagination.sort,
        };

        return [filterInput, paginationInput]
      }),
      mergeMap(([filterInput, paginationInput]) => {
        return forkJoin(
          this.getmsentitycamelList$(filterInput, paginationInput),
          this.getmsentitycamelSize$(filterInput),
        )
      }),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe(([list, size]) => {
      this.dataSource.data = list;
      this.tableSize = size;
    })
  }

  /**
   * Gets the msentitycamel list
   * @param filterInput 
   * @param paginationInput 
   */
  getmsentitycamelList$(filterInput, paginationInput){
    return this.msentitypascalListservice.getmsentitycamelList$(filterInput, paginationInput)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      map(resp => resp.data.msnamepascalmsentitiespascal)
    );
  }

    /**
   * Gets the msentitycamel size
   * @param filterInput 
   */
  getmsentitycamelSize$(filterInput){
    return this.msentitypascalListservice.getmsentitycamelSize$(filterInput)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      map(resp => resp.data && resp.data.msnamepascalmsentitiespascalSize ? resp.data.msnamepascalmsentitiespascalSize: 0)
    );
  }

  /**
   * Receives the selected msentitycamel
   * @param msentitycamel selected msentitycamel
   */
  selectmsentitycamelRow(msentitycamel) {
    this.selectedmsentitypascal = msentitycamel;
  }

  resetFilter() {
    this.filterForm.reset();
    this.paginator.pageIndex = 0;
    this.tablePage = 0;
    this.tableCount = 25;
  }

  /**
   * Navigates to the detail page
   */
  goToDetail(){
    this.router.navigate(['msentityname/new']);    
  }

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('msnameuppercase.CLOSE'), {
        duration: 4000
      });
  }

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response)))
      .pipe(
        tap((resp: any) => {
          if (response && Array.isArray(response.errors)) {
            response.errors.forEach(error => {
              this.showMessageSnackbar('ERRORS.' + ((error.extensions||{}).code || 1) )
            });
          }
          return resp;
        })
      );
  }

    /**
   * Shows an error snackbar
   * @param response
   */
  showSnackBarError(response) {
    if (response.errors) {
      if (Array.isArray(response.errors)) {
        response.errors.forEach(error => {
          if (Array.isArray(error)) {
            error.forEach(errorDetail => {
              this.showMessageSnackbar("ERRORS." + errorDetail.message.code);
            });
          } else {
            response.errors.forEach(errorData => {
              this.showMessageSnackbar("ERRORS." + errorData.message.code);
            });
          }
        });
      }
    }
  }

  /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?) {
    const translationData = [];
    if (messageKey) {
      translationData.push(messageKey);
    }

    if (detailMessageKey) {
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData).subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey] : "",
        detailMessageKey ? data[detailMessageKey] : "",
        {
          duration: 2000
        }
      );
    });
  }
  
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
