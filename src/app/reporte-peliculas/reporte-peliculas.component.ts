import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { StyleDictionary } from 'pdfmake/interfaces'; // Importa la interfaz StyleDictionary
import * as xlsx from 'xlsx';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  filtroSeleccionado: string = 'todos';
  filtrarGenero: string = '';
  filtrarYear: number | null = null;
  peliculasFiltradas: any[] = [];
  
  peliculas: any[] = [];
  
  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
    });
  }

  aplicarFiltro() {
    if (this.filtroSeleccionado === 'todos') {
      this.peliculasFiltradas = this.peliculas;
    } else if (this.filtroSeleccionado === 'genero') {
      this.peliculasFiltradas = this.peliculas.filter(
        pelicula => pelicula.genero.toLowerCase() === this.filtrarGenero.toLowerCase()
      );
    } else if (this.filtroSeleccionado === 'year') {
      this.peliculasFiltradas = this.peliculas.filter(
        pelicula => pelicula.lanzamiento === this.filtrarYear
      );
    }
  }

  exportarExcel() {
    const contenidoTabla = [
      ['Título', 'Género', 'Año de lanzamiento'],
      ...this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
    ];
  
    const workBook = xlsx.utils.book_new();
    const workSheet = xlsx.utils.aoa_to_sheet(contenidoTabla);
    xlsx.utils.book_append_sheet(workBook, workSheet, 'Películas');
    const buffer = xlsx.write(workBook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivo(buffer, 'informe_peliculas.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        },
        style: 'table'
      }
    ];

    const estilos: StyleDictionary = { 
      header: {
        fontSize: 30,
        bold: true,
        alignment: 'center',
        color: '#07FF92'
      },
      table: {
        fontSize:20,
        fillColor: '#190885',
        alignment: 'center',
        italics:true,
        color:'#FFE107'
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }

 guardarArchivo(buffer: any, fileName: string, fileType: string) {
    const data: Blob = new Blob([buffer], { type: fileType });
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      
      (window.navigator as any).msSaveOrOpenBlob(data, fileName);
    } else {
  
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  }
}
