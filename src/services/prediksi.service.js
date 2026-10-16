// src/services/prediksi.service.js
// Prediksi tabungan menggunakan metode Single Exponential Smoothing (SES)
//
// Rumus:
//   F(1)   = X(1)                              -> inisialisasi
//   F(t+1) = α * X(t) + (1 - α) * F(t)         -> peramalan periode berikutnya
// dengan X(t) = data aktual (tabungan bersih periode t = setor - tarik), F(t) = hasil ramalan periode t.
//
// Akurasi dihitung mulai t = 2 (karena F(1) = X(1) sehingga error-nya selalu 0):
//   MAD  = Σ|e| / n
//   MSE  = Σe² / n
//   MAPE = Σ(|e| / X) / n * 100%   (periode dengan X = 0 dilewati karena tidak bisa dibagi nol)

const FinancialGoals = require('../models/financialGoals.model');
const Tabungan = require('../models/tabungan.model');

const ALPHA_CANDIDATES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// ================= HELPER TANGGAL & PERIODE =================
// Semua perhitungan tanggal memakai UTC agar tidak bergeser karena zona waktu

const parseDate = (str) => {
    const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};

const toISO = (date) => date.toISOString().slice(0, 10);

const todayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// Awal periode dari sebuah tanggal: tanggal 1 (bulanan) atau hari Senin (mingguan)
const startOfPeriod = (date, periode) => {
    if (periode === 'mingguan') {
        const day = date.getUTCDay(); // 0 = Minggu
        const diff = day === 0 ? -6 : 1 - day;
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const addPeriods = (date, n, periode) => {
    if (periode === 'mingguan') {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 7 * n));
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
};

// Akhir periode (hari terakhir dalam periode)
const endOfPeriod = (start, periode) => {
    const next = addPeriods(start, 1, periode);
    return new Date(next.getTime() - 24 * 60 * 60 * 1000);
};

// Jumlah periode dari periode a ke periode b (b - a)
const diffPeriods = (a, b, periode) => {
    if (periode === 'mingguan') {
        return Math.round((b.getTime() - a.getTime()) / (7 * 24 * 60 * 60 * 1000));
    }
    return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
};

const labelPeriode = (start, periode) => {
    if (periode === 'mingguan') {
        return `${start.getUTCDate()} ${NAMA_BULAN[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
    }
    return `${NAMA_BULAN[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
};

const round2 = (v) => (v === null || v === undefined ? null : Math.round(v * 100) / 100);

// ================= INTI METODE SES =================

class PrediksiService {

    /**
     * Susun data aktual X(t): tabungan bersih per periode, dari periode transaksi pertama
     * sampai periode berjalan. Periode tanpa transaksi tetap dihitung dengan nilai 0.
     */
    buildTimeSeries(transaksi, periode) {
        if (!transaksi.length) return [];

        const totals = new Map();
        let firstStart = null;
        for (const tx of transaksi) {
            const start = startOfPeriod(parseDate(tx.tanggal), periode);
            const key = toISO(start);
            const nominal = Number(tx.nominal) || 0;
            const signed = tx.jenisTransaksi.toLowerCase() === 'setor' ? nominal : -nominal;
            totals.set(key, (totals.get(key) || 0) + signed);
            if (!firstStart || start < firstStart) firstStart = start;
        }

        const currentStart = startOfPeriod(todayUTC(), periode);
        const lastTxStart = new Date(Math.max(...[...totals.keys()].map((k) => parseDate(k).getTime())));
        const lastStart = lastTxStart > currentStart ? lastTxStart : currentStart;

        const series = [];
        for (let s = firstStart; s <= lastStart; s = addPeriods(s, 1, periode)) {
            const key = toISO(s);
            series.push({
                periodeMulai: key,
                label: labelPeriode(s, periode),
                aktual: totals.get(key) || 0,
            });
        }
        return series;
    }

    /**
     * Hitung SES untuk satu nilai α.
     * Mengembalikan langkah perhitungan per periode, ramalan periode berikutnya, dan nilai error.
     */
    calculateSES(series, alpha) {
        const langkah = [];
        let forecast = null;

        let sumAbs = 0, sumSq = 0, sumPct = 0, nErr = 0, nPct = 0;

        series.forEach((row, i) => {
            const X = row.aktual;
            // F(1) = X(1); selanjutnya F(t) sudah dihitung dari periode sebelumnya
            const F = i === 0 ? X : forecast;

            let error = null, absError = null, sqError = null, pctError = null;
            if (i > 0) {
                error = X - F;
                absError = Math.abs(error);
                sqError = error * error;
                sumAbs += absError;
                sumSq += sqError;
                nErr++;
                if (X !== 0) {
                    pctError = (absError / Math.abs(X)) * 100;
                    sumPct += pctError;
                    nPct++;
                }
            }

            langkah.push({
                t: i + 1,
                periodeMulai: row.periodeMulai,
                label: row.label,
                aktual: round2(X),
                ramalan: round2(F),
                error: round2(error),
                absError: round2(absError),
                sqError: round2(sqError),
                pctError: round2(pctError),
            });

            // F(t+1) = α * X(t) + (1 - α) * F(t)
            forecast = alpha * X + (1 - alpha) * F;
        });

        return {
            alpha,
            langkah,
            ramalanBerikutnya: round2(forecast),
            mad: nErr ? round2(sumAbs / nErr) : null,
            mse: nErr ? round2(sumSq / nErr) : null,
            mape: nPct ? round2(sumPct / nPct) : null,
        };
    }

    /**
     * Uji semua kandidat α, pilih α terbaik berdasarkan MAPE terkecil.
     * Jika MAPE tidak bisa dihitung (semua data aktual 0), gunakan MSE terkecil.
     */
    findBestAlpha(series) {
        const hasil = ALPHA_CANDIDATES.map((a) => this.calculateSES(series, a));
        const byMape = hasil.filter((h) => h.mape !== null);
        const pool = byMape.length ? byMape : hasil.filter((h) => h.mse !== null);
        const kriteria = byMape.length ? 'MAPE' : 'MSE';

        let terbaik = pool[0] || hasil[0];
        for (const h of pool) {
            const nilai = kriteria === 'MAPE' ? h.mape : h.mse;
            const nilaiTerbaik = kriteria === 'MAPE' ? terbaik.mape : terbaik.mse;
            if (nilai < nilaiTerbaik) terbaik = h;
        }
        return { terbaik, kriteria, perbandingan: hasil };
    }

    /**
     * Perencanaan goal berdasarkan hasil ramalan:
     * estimasi kapan target tercapai & rekomendasi nominal per periode agar tepat waktu.
     */
    buildPerencanaan(goal, totalTerkumpul, ramalan, periode) {
        const targetNominal = Number(goal.targetNominal);
        const sisaTarget = Math.max(0, targetNominal - totalTerkumpul);
        const currentStart = startOfPeriod(todayUTC(), periode);
        const targetDate = parseDate(goal.targetTanggal);
        const targetStart = startOfPeriod(targetDate, periode);

        // Jumlah periode tersisa sampai target tanggal (periode berjalan dihitung)
        const sisaPeriode = Math.max(0, diffPeriods(currentStart, targetStart, periode) + 1);

        const hasil = {
            targetNominal,
            totalTerkumpul: round2(totalTerkumpul),
            sisaTarget: round2(sisaTarget),
            targetTanggal: goal.targetTanggal,
            sisaPeriode,
            rekomendasiPerPeriode: sisaPeriode > 0 ? round2(sisaTarget / sisaPeriode) : round2(sisaTarget),
            periodeDibutuhkan: null,
            estimasiTanggalTercapai: null,
            estimasiLabel: null,
            status: null,
            keterangan: '',
        };

        if (sisaTarget <= 0) {
            hasil.status = 'Tercapai';
            hasil.rekomendasiPerPeriode = 0;
            hasil.keterangan = 'Target goal sudah tercapai.';
            return hasil;
        }

        if (ramalan === null || ramalan <= 0) {
            hasil.status = 'Tidak Tercapai';
            hasil.keterangan = 'Ramalan tabungan per periode ≤ 0, dengan pola menabung saat ini target tidak akan tercapai.';
            return hasil;
        }

        // Periode yang dibutuhkan jika menabung sebesar ramalan setiap periode (dimulai periode berjalan)
        const periodeDibutuhkan = Math.ceil(sisaTarget / ramalan);
        const estimasiStart = addPeriods(currentStart, periodeDibutuhkan - 1, periode);
        const estimasiTanggal = endOfPeriod(estimasiStart, periode);

        hasil.periodeDibutuhkan = periodeDibutuhkan;
        hasil.estimasiTanggalTercapai = toISO(estimasiTanggal);
        hasil.estimasiLabel = labelPeriode(estimasiStart, periode);

        if (estimasiStart <= targetStart) {
            hasil.status = 'On Track';
            hasil.keterangan = 'Dengan pola menabung saat ini, target diperkirakan tercapai sebelum target tanggal.';
        } else {
            hasil.status = 'Terlambat';
            const telat = diffPeriods(targetStart, estimasiStart, periode);
            const satuan = periode === 'mingguan' ? 'minggu' : 'bulan';
            hasil.keterangan = `Diperkirakan terlambat ${telat} ${satuan} dari target tanggal. Tingkatkan tabungan sesuai rekomendasi.`;
        }
        return hasil;
    }

    async getGoalWithTransaksi(idGoal) {
        const goal = await FinancialGoals.findByPk(idGoal);
        if (!goal) return { goal: null, transaksi: [] };
        const transaksi = await Tabungan.findAll({
            where: { idGoal },
            order: [['tanggal', 'ASC'], ['idTabungan', 'ASC']],
        });
        return { goal, transaksi };
    }

    hitungTotal(transaksi) {
        return transaksi.reduce((sum, tx) => {
            const n = Number(tx.nominal) || 0;
            return tx.jenisTransaksi.toLowerCase() === 'setor' ? sum + n : sum - n;
        }, 0);
    }

    /**
     * Prediksi lengkap untuk satu goal (dipakai halaman detail perhitungan).
     * alphaInput: angka 0 < α < 1, atau null untuk memilih α terbaik otomatis.
     */
    async prediksiGoal(goal, transaksi, periode = 'bulanan', alphaInput = null) {
        const series = this.buildTimeSeries(transaksi, periode);
        const totalTerkumpul = this.hitungTotal(transaksi);

        const base = {
            idGoal: goal.idGoal,
            namaGoal: goal.namaGoal,
            periode,
            jumlahData: series.length,
        };

        if (series.length === 0) {
            return {
                ...base,
                cukupData: false,
                pesan: 'Belum ada transaksi tabungan untuk goal ini.',
                perencanaan: this.buildPerencanaan(goal, totalTerkumpul, null, periode),
            };
        }

        const { terbaik, kriteria, perbandingan } = this.findBestAlpha(series);
        const terpilih = alphaInput !== null ? this.calculateSES(series, alphaInput) : terbaik;

        return {
            ...base,
            cukupData: series.length >= 3,
            pesan: series.length < 3
                ? 'Data kurang dari 3 periode, hasil prediksi belum akurat.'
                : '',
            modeAlpha: alphaInput !== null ? 'manual' : 'otomatis',
            kriteriaAlpha: kriteria,
            alphaTerbaik: terbaik.alpha,
            alpha: terpilih.alpha,
            ramalanBerikutnya: terpilih.ramalanBerikutnya,
            mad: terpilih.mad,
            mse: terpilih.mse,
            mape: terpilih.mape,
            langkah: terpilih.langkah,
            perbandingan: perbandingan.map(({ alpha, mad, mse, mape, ramalanBerikutnya }) => ({
                alpha, mad, mse, mape, ramalanBerikutnya,
            })),
            perencanaan: this.buildPerencanaan(goal, totalTerkumpul, terpilih.ramalanBerikutnya, periode),
        };
    }

    async prediksiByGoalId(idGoal, periode, alphaInput) {
        const { goal, transaksi } = await this.getGoalWithTransaksi(idGoal);
        if (!goal) return null;
        return this.prediksiGoal(goal, transaksi, periode, alphaInput);
    }

    /**
     * Ringkasan prediksi semua goal milik user (α terbaik otomatis).
     */
    async ringkasanByUser(idUser, periode) {
        const goals = await FinancialGoals.findAll({
            where: { idUser },
            include: [{ model: Tabungan, as: 'riwayatTabungan' }],
            order: [['targetTanggal', 'ASC']],
        });

        return Promise.all(goals.map(async (goal) => {
            const transaksi = [...(goal.riwayatTabungan || [])].sort((a, b) =>
                String(a.tanggal).localeCompare(String(b.tanggal)) || a.idTabungan - b.idTabungan
            );
            const p = await this.prediksiGoal(goal, transaksi, periode, null);
            return {
                idGoal: p.idGoal,
                namaGoal: p.namaGoal,
                jumlahData: p.jumlahData,
                alpha: p.alpha ?? null,
                mape: p.mape ?? null,
                ramalanBerikutnya: p.ramalanBerikutnya ?? null,
                perencanaan: p.perencanaan,
            };
        }));
    }
}

module.exports = new PrediksiService();
