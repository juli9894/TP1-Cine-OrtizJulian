import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearFuncion } from './crear-funcion';

describe('CrearFuncion', () => {
  let component: CrearFuncion;
  let fixture: ComponentFixture<CrearFuncion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearFuncion],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearFuncion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
