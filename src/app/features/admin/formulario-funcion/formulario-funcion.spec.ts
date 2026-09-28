import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioFuncion } from './formulario-funcion';

describe('FormularioFuncion', () => {
  let component: FormularioFuncion;
  let fixture: ComponentFixture<FormularioFuncion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioFuncion],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioFuncion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
