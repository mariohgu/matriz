<?php


namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class PresupuestoYMensualImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $mesActual = now()->month;

        foreach ($rows as $row) {
            $codigoClasificador = $this->armarCodigoClasificador($row);

            $idClasificador = DB::table('clasificadores')
                ->where('codigo_clasificador', $codigoClasificador)
                ->value('id_clasificador');

            if (!$idClasificador) continue;

            DB::table('presupuesto_resumen')->updateOrInsert(
                [
                    'id_ae' => $row['sec_func'],
                    'id_clasificador' => $idClasificador,
                    'anio' => $row['ano_eje']
                ],
                [
                    'mto_pia' => $row['mto_pia'] ?? 0,
                    'mto_modificaciones' => $row['mto_modificaciones'] ?? 0,
                    'mto_pim' => $row['mto_pim'] ?? 0,
                    'mto_certificado' => $row['mto_certificado'] ?? 0,
                    'mto_compro_anual' => $row['mto_compro_anual'] ?? 0,
                ]
            );

            for ($mes = 1; $mes <= $mesActual; $mes++) {
                $sufijo = str_pad($mes, 2, '0', STR_PAD_LEFT);

                DB::table('ejecucion_mensual')->updateOrInsert(
                    [
                        'id_ae' => $row['sec_func'],
                        'id_clasificador' => $idClasificador,
                        'anio' => $row['ano_eje'],
                        'mes' => $mes
                    ],
                    [
                        'mto_at_comp' => $row["mto_at_comp_$sufijo"] ?? 0,
                        'mto_devengado' => $row["mto_devenga_$sufijo"] ?? 0,
                        'mto_girado' => $row["mto_girado_$sufijo"] ?? 0,
                        'mto_pagado' => $row["mto_pagado_$sufijo"] ?? 0,
                    ]
                );
            }
        }
    }

    private function armarCodigoClasificador($row)
    {
        return
            $this->extraer($row['tipo_transaccion']) .
            $this->extraer($row['generica']) .
            $this->extraer($row['subgenerica']) .
            $this->extraer($row['subgenerica_det']) .
            $this->extraer($row['especifica']) .
            $this->extraerFinal($row['especifica_det']);
    }

    private function extraer($valor)
    {
        return explode('.', $valor)[0] . '.';
    }

    private function extraerFinal($valor)
    {
        if (is_numeric($valor)) return intval($valor);
        return explode('.', $valor)[0];
    }
}
