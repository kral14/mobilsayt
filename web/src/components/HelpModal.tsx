import { useState } from 'react'

interface HelpModalProps {
    onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [activeCategory, setActiveCategory] = useState<'general' | 'filter'>('general')
    const [activeTab, setActiveTab] = useState<'conditions' | 'components' | 'howto'>('conditions')

    const tabStyle = (isActive: boolean) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        background: isActive ? '#3d8bfd' : '#f0f0f0',
        color: isActive ? 'white' : '#333',
        border: 'none',
        borderBottom: isActive ? 'none' : '1px solid #ddd',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '14px',
        borderRadius: '4px 4px 0 0',
        marginRight: '2px'
    })

    const sectionHeaderStyle = {
        background: '#e7f3ff',
        padding: '8px 12px',
        fontWeight: 'bold',
        marginTop: '15px',
        marginBottom: '8px',
        borderLeft: '4px solid #3d8bfd',
        fontSize: '14px'
    }

    const itemStyle = {
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '13px'
    }

    const categoryStyle = (isActive: boolean) => ({
        padding: '12px 15px',
        cursor: 'pointer',
        background: isActive ? '#e7f3ff' : 'transparent',
        color: isActive ? '#0d6efd' : '#333',
        fontWeight: isActive ? 'bold' : 'normal',
        borderLeft: isActive ? '4px solid #0d6efd' : '4px solid transparent',
        transition: 'all 0.2s',
        fontSize: '14px'
    })

    const renderFilterContent = () => (
        <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '15px' }}>
                <button onClick={() => setActiveTab('conditions')} style={tabStyle(activeTab === 'conditions')}>
                    Şərtlər
                </button>
                <button onClick={() => setActiveTab('components')} style={tabStyle(activeTab === 'components')}>
                    Komponentlər
                </button>
                <button onClick={() => setActiveTab('howto')} style={tabStyle(activeTab === 'howto')}>
                    Necə İşləyir
                </button>
            </div>

            {/* Content */}
            <div style={{ maxHeight: 'calc(70vh - 100px)', overflowY: 'auto', paddingRight: '5px' }}>
                {activeTab === 'conditions' && (
                    <div>
                        <p style={{ marginTop: 0, color: '#666' }}>
                            Filtr şərtləri məlumatları müqayisə etmək üçün istifadə olunur. Aşağıda bütün şərtlərin izahı:
                        </p>

                        <div style={sectionHeaderStyle}>Ümumi Şərtlər</div>
                        <div style={itemStyle}>
                            <strong>Bərabərdir (equals)</strong> - Dəyər tam olaraq bərabərdir<br />
                            <em>Nümunə: Təchizatçı = "ABC Şirkəti"</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Bərabər deyil (not_equals)</strong> - Dəyər bərabər deyil<br />
                            <em>Nümunə: Status ≠ "Ləğv edilib"</em>
                        </div>

                        <div style={sectionHeaderStyle}>Siyahı Əməliyyatları</div>
                        <div style={itemStyle}>
                            <strong>Siyahıda var (in)</strong> - Dəyər seçilmiş siyahıda var<br />
                            <em>Nümunə: Təchizatçı siyahıda [ABC, XYZ, DEF]</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Siyahıda yoxdur (not_in)</strong> - Dəyər seçilmiş siyahıda yoxdur<br />
                            <em>Nümunə: Məhsul siyahıda deyil [A, B, C]</em>
                        </div>

                        <div style={sectionHeaderStyle}>Mətn Əməliyyatları</div>
                        <div style={itemStyle}>
                            <strong>Tərkibində var (contains)</strong> - Mətn daxilində axtarılan söz var<br />
                            <em>Nümunə: Ad içində "Kompüter" var</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Tərkibində yoxdur (not_contains)</strong> - Mətn daxilində axtarılan söz yoxdur<br />
                            <em>Nümunə: Qeyd içində "test" yoxdur</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>İlə başlayır (starts_with)</strong> - Mətn müəyyən sözlə başlayır<br />
                            <em>Nümunə: Kod "INV-" ilə başlayır</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>İlə başlamır (not_starts_with)</strong> - Mətn müəyyən sözlə başlamır<br />
                            <em>Nümunə: Nömrə "TMP-" ilə başlamır</em>
                        </div>

                        <div style={sectionHeaderStyle}>Rəqəm Əməliyyatları</div>
                        <div style={itemStyle}>
                            <strong>Böyükdür (greater)</strong> - Rəqəm göstərilən dəyərdən böyükdür<br />
                            <em>Nümunə: Məbləğ &gt; 1000</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Böyükdür və ya bərabərdir (greater_or_equal)</strong> - Rəqəm böyük və ya bərabərdir<br />
                            <em>Nümunə: Miqdar ≥ 50</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Kiçikdir (less)</strong> - Rəqəm göstərilən dəyərdən kiçikdir<br />
                            <em>Nümunə: Endirim &lt; 10</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Kiçikdir və ya bərabərdir (less_or_equal)</strong> - Rəqəm kiçik və ya bərabərdir<br />
                            <em>Nümunə: Qiymət ≤ 500</em>
                        </div>

                        <div style={sectionHeaderStyle}>Mövcudluq Yoxlaması</div>
                        <div style={itemStyle}>
                            <strong>Doldurulub (is_set)</strong> - Sahə doldurulub (boş deyil)<br />
                            <em>Nümunə: Qeyd doldurulub</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Boşdur (is_not_set)</strong> - Sahə boşdur<br />
                            <em>Nümunə: Təsvir boşdur</em>
                        </div>

                        <div style={sectionHeaderStyle}>Qrup Əməliyyatları</div>
                        <div style={itemStyle}>
                            <strong>Qrupdadır (in_group)</strong> - Element müəyyən qrupda yerləşir<br />
                            <em>Nümunə: Kateqoriya "Elektronika" qrupunda</em>
                        </div>
                        <div style={itemStyle}>
                            <strong>Qrupda deyil (not_in_group)</strong> - Element qrupda deyil<br />
                            <em>Nümunə: Məhsul "Köhnə" qrupunda deyil</em>
                        </div>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div>
                        <p style={{ marginTop: 0, color: '#666' }}>
                            Komponentlər filtr yaratmaq üçün istifadə olunan sahələrdir:
                        </p>

                        <div style={itemStyle}>
                            <strong>Təchizatçı / Müştəri</strong><br />
                            Qaimə ilə əlaqəli təchizatçı və ya müştəri məlumatı. Siyahıdan seçilir və ya ad üzrə axtarılır.
                        </div>

                        <div style={itemStyle}>
                            <strong>Tarix</strong><br />
                            Qaimənin tarixi. Tarix aralığı seçə bilərsiniz (məsələn: 01.01.2024 - 31.12.2024).
                        </div>

                        <div style={itemStyle}>
                            <strong>Məhsul</strong><br />
                            Qaimədə olan məhsullar. Çoxlu məhsul seçə bilərsiniz və qaimələr bu məhsullardan ən azı birinə malik olmalıdır.
                        </div>

                        <div style={itemStyle}>
                            <strong>Məbləğ</strong><br />
                            Qaimənin ümumi məbləği. Rəqəm əməliyyatları ilə müqayisə edilə bilər (böyükdür, kiçikdir, və s.).
                        </div>

                        <div style={itemStyle}>
                            <strong>Status</strong><br />
                            Qaimənin statusu (Təsdiqlənib, Gözləyir, Ləğv edilib, və s.). Dropdown-dan seçilir.
                        </div>

                        <div style={itemStyle}>
                            <strong>Qeyd</strong><br />
                            Qaimə haqqında əlavə qeydlər. Mətn əməliyyatları ilə axtarış edilə bilər.
                        </div>

                        <div style={itemStyle}>
                            <strong>Nömrə</strong><br />
                            Qaimə nömrəsi. Mətn və ya rəqəm kimi axtarıla bilər.
                        </div>
                    </div>
                )}

                {activeTab === 'howto' && (
                    <div>
                        <h3 style={{ marginTop: 0, color: '#3d8bfd' }}>Filtr Sistemi Necə İşləyir?</h3>

                        <div style={sectionHeaderStyle}>1. Filtr Əlavə Etmək</div>
                        <p>
                            Sol tərəfdəki komponent siyahısından istədiyiniz komponenti seçin (məsələn: Təchizatçı, Tarix).
                            Komponent avtomatik olaraq sağ tərəfə əlavə olunacaq.
                        </p>

                        <div style={sectionHeaderStyle}>2. Şərt Seçmək</div>
                        <p>
                            Hər filtr üçün şərt seçin (Bərabərdir, Böyükdür, İçindədir, və s.).
                            Şərt komponentin tipindən asılıdır - məsələn, tarix üçün rəqəm əməliyyatları, mətn üçün mətn əməliyyatları.
                        </p>

                        <div style={sectionHeaderStyle}>3. Dəyər Daxil Etmək</div>
                        <p>
                            Seçilmiş şərtə uyğun dəyər daxil edin:
                        </p>
                        <ul style={{ marginLeft: '20px' }}>
                            <li>Təchizatçı/Müştəri: Siyahıdan seçin</li>
                            <li>Tarix: Təqvimdən seçin və ya manual yazın (15.12.2024)</li>
                            <li>Məbləğ: Rəqəm yazın</li>
                            <li>Mətn: Axtarmaq istədiyiniz sözü yazın</li>
                        </ul>

                        <div style={sectionHeaderStyle}>4. Aktiv/Qeyri-Aktiv</div>
                        <p>
                            Hər filtrin solundakı checkbox ilə onu aktiv/qeyri-aktiv edə bilərsiniz.
                            Qeyri-aktiv filtrlər tətbiq olunmur, amma silinmir - istədiyiniz zaman yenidən aktiv edə bilərsiniz.
                        </p>

                        <div style={sectionHeaderStyle}>5. Tətbiq Etmək</div>
                        <p>
                            "Tətbiq et" düyməsinə basın. Yalnız aktiv (işarələnmiş) filtrlər tətbiq olunacaq.
                            Bütün şərtlər eyni anda yoxlanılır (AND məntiqı).
                        </p>

                        <div style={sectionHeaderStyle}>6. Filtr Presetləri</div>
                        <p>
                            Tez-tez istifadə etdiyiniz filtr kombinasiyalarını saxlaya bilərsiniz:
                        </p>
                        <ul style={{ marginLeft: '20px' }}>
                            <li><strong>Saxla:</strong> Cari filtrləri ad altında saxlayın</li>
                            <li><strong>Yüklə:</strong> Əvvəllər saxlanmış filtrləri yükləyin</li>
                            <li><strong>Sil:</strong> Sağ klik ilə preset-i silin</li>
                        </ul>

                        <div style={sectionHeaderStyle}>Məsləhətlər</div>
                        <ul style={{ marginLeft: '20px', color: '#666' }}>
                            <li>Çoxlu filtr istifadə edərək daha dəqiq nəticələr əldə edin</li>
                            <li>Tarix aralığı seçərkən "Bu ay", "Keçən ay" kimi hazır seçimlərdən istifadə edin</li>
                            <li>Mətn axtarışında "İçindədir" şərti ən çox istifadə olunur</li>
                            <li>Filtrləri preset kimi saxlayaraq vaxt qazanın</li>
                        </ul>
                    </div>
                )}
            </div>
        </>
    )

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }}
            onClick={onClose}
        >
            <div style={{
                background: 'white',
                width: '900px', // Increased width for sidebar
                height: '70vh', // Fixed height
                maxHeight: '80vh',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: '#3d8bfd',
                    color: 'white',
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Kömək və İzahlar</h2>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '24px',
                        cursor: 'pointer',
                        lineHeight: 1
                    }}>×</button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <div style={{
                        width: '220px',
                        background: '#f8f9fa',
                        borderRight: '1px solid #ddd',
                        padding: '10px 0',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            padding: '10px 15px',
                            color: '#666',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                        }}>Bölmələr</div>

                        <div
                            style={categoryStyle(activeCategory === 'general')}
                            onClick={() => setActiveCategory('general')}
                        >
                            Ümumi
                        </div>
                        <div
                            style={categoryStyle(activeCategory === 'filter')}
                            onClick={() => setActiveCategory('filter')}
                        >
                            Ətraflı Axtarış
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                        {activeCategory === 'general' && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#aaa',
                                flexDirection: 'column'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>❓</div>
                                <div>Bu bölmə üçün hələlik kömək məlumatı yoxdur.</div>
                                <div style={{ fontSize: '13px', marginTop: '10px' }}>Zəhmət olmasa sol tərəfdən mövzu seçin.</div>
                            </div>
                        )}

                        {activeCategory === 'filter' && renderFilterContent()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HelpModal
