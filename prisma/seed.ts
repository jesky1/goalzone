import { db } from '@/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    db.category.upsert({
      where: { slug: 'premier-league' },
      update: {},
      create: { name: 'Premier League', slug: 'premier-league' },
    }),
    db.category.upsert({
      where: { slug: 'champions-league' },
      update: {},
      create: { name: 'Champions League', slug: 'champions-league' },
    }),
    db.category.upsert({
      where: { slug: 'la-liga' },
      update: {},
      create: { name: 'La Liga', slug: 'la-liga' },
    }),
    db.category.upsert({
      where: { slug: 'transfer' },
      update: {},
      create: { name: 'Transfer', slug: 'transfer' },
    }),
    db.category.upsert({
      where: { slug: 'tactical-analysis' },
      update: {},
      create: { name: 'Tactical Analysis', slug: 'tactical-analysis' },
    }),
  ]);

  // Create admin profile
  const admin = await db.profile.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      role: 'admin',
    },
  });

  const editor = await db.profile.upsert({
    where: { username: 'redaksi' },
    update: {},
    create: {
      username: 'redaksi',
      role: 'editor',
    },
  });

  // Create articles
  const articles = [
    {
      title: 'Arsenal Kian Kokoh di Puncak Klasemen Usai Tekuk Manchester City',
      slug: 'arsenal-tekuk-manchester-city',
      content: `Arsenal berhasil mempertahankan posisi puncak klasemen Premier League setelah mengalahkan Manchester City dengan skor 3-1 di Emirates Stadium. 

Gol-gol Arsenal dicetak oleh Bukayo Saka di menit ke-15, Martin Ødegaard di menit ke-34, dan Gabriel Jesus di menit ke-72. Sementara gol balasan City dicetak oleh Erling Haaland di menit ke-55.

Pelatih Arsenal, Mikel Arteta, mengaku sangat puas dengan performa timnya. "Ini adalah kemenangan yang sangat penting bagi kami. Pemain tampil luar biasa dan kami menunjukkan bahwa kita adalah tim yang kuat," ujar Arteta.

Dengan kemenangan ini, Arsenal kini unggul 5 poin dari Manchester City yang menempati posisi kedua. Pertandingan berikutnya Arsenal akan menghadapi Liverpool di Anfield.`,
      summary: 'The Gunners meraih kemenangan meyakinkan 3-1 atas The Citizens di Emirates Stadium.',
      imageUrl: '/images/articles/premier-league.jpg',
      categoryId: categories[0].id,
      authorId: admin.id,
      viewCount: 15420,
      isFeatured: true,
      readTime: 4,
    },
    {
      title: 'Real Madrid Melaju ke Semifinal Usai Drama Adu Penalti Kontra Bayern Munich',
      slug: 'real-madrid-semifinal-champions-league',
      content: `Real Madrid berhasil melaju ke babak semifinal Liga Champions UEFA setelah mengalahkan Bayern Munich melalui adu penalti yang dramatis di Santiago Bernabéu.

Pertandingan berakhir imbang 2-2 dalam waktu normal. Vinícius Jr membuka skor di menit ke-28, sebelum Harry Kane menyamakan kedudukan di menit ke-45. Di babak kedua, Jude Bellingham kembali membawa Madrid unggul di menit ke-67, namun Leroy Sané menyamakan skor di menit ke-89.

Dalam adu penalti, kiper Madrid Andriy Lunin menjadi pahlawan setelah menyelamatkan dua eksekusi Bayern. Madrid menang 4-3 dalam adu penalti.

"Ini adalah malam yang luar biasa. Tim menunjukkan karakter yang kuat dan tidak pernah menyerah," kata Carlo Ancelotti usai pertandingan.`,
      summary: 'Los Blancos lolos ke semifinal lewat adu penalti yang menegangkan melawan Die Roten.',
      imageUrl: '/images/articles/champions-league.jpg',
      categoryId: categories[1].id,
      authorId: editor.id,
      viewCount: 23150,
      isFeatured: true,
      readTime: 5,
    },
    {
      title: 'El Clásico: Barcelona vs Real Madrid Berakhir Imbang Tanpa Gol',
      slug: 'el-clasico-barcelona-real-madrid-imbang',
      content: `Pertandingan bertajuk El Clásico antara Barcelona dan Real Madrid di Camp Nou berakhir tanpa gol. Kedua tim saling berbagi angka dalam laga yang berjalan ketat.

Barcelona lebih mendominasi penguasaan bola dengan 58%, namun tidak mampu menciptakan peluang berbahaya yang berarti. Robert Lewandowski beberapa kali mendapat peluang, namun tendangannya masih bisa ditepis oleh Thibaut Courtois.

Di sisi lain, Real Madrid tampil lebih efektif dalam serangan balik. Vinícius Jr sempat menjebol gawang Barcelona di menit ke-78, namun gol tersebut dianulir oleh VAR karena offside.

Hasil imbang ini membuat Barcelona tetap memimpin klasemen La Liga dengan keunggulan 2 poin dari Madrid.`,
      summary: 'Duel panas di Camp Nou berakhir 0-0, Barcelona tetap memimpin klasemen.',
      imageUrl: '/images/articles/la-liga.jpg',
      categoryId: categories[2].id,
      authorId: admin.id,
      viewCount: 31200,
      isFeatured: true,
      readTime: 4,
    },
    {
      title: 'BREAKING: Mbappe Resmi Bergabung dengan Real Madrid',
      slug: 'mbappe-resmi-real-madrid',
      content: `Kylian Mbappé akhirnya resmi bergabung dengan Real Madrid setelah kontraknya dengan Paris Saint-Germain berakhir. Pemain asal Prancis tersebut menandatangani kontrak berdurasi lima tahun dengan Los Blancos.

Pengumuman ini disampaikan langsung oleh Real Madrid melalui situs resmi klub. Mbappé akan diperkenalkan di Santiago Bernabéu pada pekan depan.

"Saya sangat senang akhirnya bisa bergabung dengan klub impian saya. Ini adalah mimpi yang menjadi kenyataan," ujar Mbappé dalam pernyataannya.

Florentino Pérez, presiden Real Madrid, menyatakan bahwa kedatangan Mbappé adalah momen bersejarah bagi klub. "Kylian adalah pemain terbaik di dunia dan kami sangat senang ia memilih Real Madrid," kata Pérez.`,
      summary: 'Bintang Prancis itu menandatangani kontrak lima tahun dengan Los Blancos.',
      imageUrl: '/images/articles/transfer.jpg',
      categoryId: categories[3].id,
      authorId: editor.id,
      viewCount: 45800,
      isFeatured: true,
      readTime: 3,
    },
    {
      title: 'Analisis Taktis: Bagaimana Arsenal Menghancurkan City dengan Pressing Tinggi',
      slug: 'analisis-taktis-arsenal-pressing',
      content: `Kemenangan Arsenal atas Manchester City bukan sekadar keberuntungan. Ada rencana taktis yang matang di balik kemenangan 3-1 tersebut.

Mikel Arteta menerapkan pressing tinggi sejak menit pertama. Trio lini tengah Arsenal (Rice, Ødegaard, Havertz) bergerak kompak untuk memutuskan build-up City. Strategi ini berhasil membuat Rodri kehilangan ruang dan beberapa kali kehilangan bola di area berbahaya.

Dari segi statistik xG (Expected Goals), Arsenal mencatatkan 2.45 berbanding 0.89 milik City. Ini menunjukkan bahwa kemenangan Arsenal sangat layak.

Arteta juga melakukan rotasi cerdas dengan menurunkan Leandro Trossard dari awal. Trossard berkontribusi besar dalam menciptakan ruang untuk Saka di sisi kanan.`,
      summary: 'Strategi pressing ketat Arteta berhasil mematikan permainan build-up Pep Guardiola.',
      imageUrl: '/images/articles/tactical.jpg',
      categoryId: categories[4].id,
      authorId: admin.id,
      viewCount: 8920,
      isFeatured: false,
      readTime: 6,
    },
    {
      title: 'Liverpool Bangkit dari Ketertinggalan, Tundukkan Tottenham 4-2',
      slug: 'liverpool-tundukkan-tottenham',
      content: `Liverpool menunjukkan mentalitas juara setelah berhasil bangkit dari ketertinggalan 0-2 untuk mengalahkan Tottenham Hotspur dengan skor 4-2 di Anfield.

Tottenham sempat memimpin 2-0 melalui gol Son Heung-min (12') dan James Maddison (24'). Namun Liverpool membalikkan keadaan melalui gol Mohamed Salah (38', 67'), Darwin Núñez (52'), dan Diogo Jota (81').

Mohamed Salah menjadi bintang pertandingan dengan dua gol dan satu assist. Performanya semakin memantapkan posisinya sebagai pencetak gol terbanyak sementara Premier League dengan 22 gol.

Jurgen Klopp memuji mentalitas timnya. "Ini menunjukkan karakter tim yang luar biasa. Kami tidak pernah menyerah meski tertinggal dua gol," ujar Klopp.`,
      summary: 'The Reds membalikkan kedudukan dramatis di Anfield berkat brace Salah.',
      imageUrl: '/images/articles/premier-league.jpg',
      categoryId: categories[0].id,
      authorId: editor.id,
      viewCount: 19300,
      isFeatured: false,
      readTime: 4,
    },
  ];

  for (const article of articles) {
    await db.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }

  // Create sample comments
  const allArticles = await db.article.findMany();
  
  const comments = [
    { articleId: allArticles[0].id, userId: editor.id, text: 'Kemenangan yang sangat penting! Arsenal tampil luar biasa hari ini.' },
    { articleId: allArticles[0].id, userId: admin.id, text: 'Saka semakin matang setiap pertandingan. Calon bintang besar!' },
    { articleId: allArticles[1].id, userId: admin.id, text: 'Lunin heroik! Penyelamatan penaltinya sangat krusial.' },
    { articleId: allArticles[2].id, userId: editor.id, text: 'El Clásio tanpa gol tapi tetap seru. Kedua tim bermain sangat hati-hati.' },
    { articleId: allArticles[3].id, userId: admin.id, text: 'Akhirnya! Setelah lama dinantikan, Mbappe resmi ke Madrid.' },
    { articleId: allArticles[4].id, userId: editor.id, text: 'Analisis yang sangat mendalam. Arteta memang jenius taktis.' },
  ];

  for (const comment of comments) {
    await db.comment.create({ data: comment });
  }

  console.log('✅ Seeding completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
