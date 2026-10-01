import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioPelicula } from './formulario-pelicula';

describe('FormularioPelicula', () => {
  let component: FormularioPelicula;
  let fixture: ComponentFixture<FormularioPelicula>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioPelicula],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioPelicula);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
