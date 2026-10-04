import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioCombo } from './formulario-combo';

describe('FormularioCombo', () => {
  let component: FormularioCombo;
  let fixture: ComponentFixture<FormularioCombo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCombo],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCombo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
