import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

type ReviewType = 'dish' | 'order' | 'restaurant';

interface ReviewScreenProps {}

const ReviewScreen: React.FC<ReviewScreenProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Obtener el tipo de review desde location.state o parámetros de URL
  const reviewType = (location.state as any)?.reviewType || 'restaurant' as ReviewType;
  const itemId = (location.state as any)?.itemId || null;
  const orderId = (location.state as any)?.orderId || null;
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [chipInput, setChipInput] = useState('');
  const [showChipSuggestions, setShowChipSuggestions] = useState(false);
  
  // Opciones de chips según el tipo de review
  const chipOptions = {
    dish: [
      t('review.chips.excellentService'),
      t('review.chips.deliciousFood'),
      t('review.chips.perfectTemperature'),
      t('review.chips.goodPortion'),
      t('review.chips.wellPresented')
    ],
    order: [
      t('review.chips.excellentService'),
      t('review.chips.deliciousFood'),
      t('review.chips.quickService'),
      t('review.chips.goodValue'),
      t('review.chips.completeOrder')
    ],
    restaurant: [
      t('review.chips.excellentService'),
      t('review.chips.deliciousFood'),
      t('review.chips.pleasantAtmosphere'),
      t('review.chips.perfectCoffee'),
      t('review.chips.quickService')
    ]
  };
  
  const currentChipOptions = chipOptions[reviewType];
  
  const getRatingLabel = (rating: number): string => {
    if (rating === 0) return '';
    if (rating === 1) return t('review.ratingLabels.veryBad');
    if (rating === 2) return t('review.ratingLabels.bad');
    if (rating === 3) return t('review.ratingLabels.okay');
    if (rating === 4) return t('review.ratingLabels.good');
    if (rating === 5) return t('review.ratingLabels.excellent');
    return '';
  };
  
  const handleStarClick = (value: number) => {
    setRating(value);
  };
  
  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };
  
  const handleStarLeave = () => {
    setHoveredRating(0);
  };
  
  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    );
    setChipInput('');
    setShowChipSuggestions(false);
  };
  
  // Filtrar chips disponibles según el input
  const filteredChipSuggestions = chipInput.trim() 
    ? currentChipOptions.filter(chip => 
        chip.toLowerCase().includes(chipInput.toLowerCase()) &&
        !selectedChips.includes(chip)
      )
    : [];
  
  const handleChipInputChange = (value: string) => {
    setChipInput(value);
    setShowChipSuggestions(value.trim().length > 0 && filteredChipSuggestions.length > 0);
  };
  
  const handleAddCustomChip = () => {
    if (chipInput.trim() && !selectedChips.includes(chipInput.trim())) {
      setSelectedChips(prev => [...prev, chipInput.trim()]);
      setChipInput('');
      setShowChipSuggestions(false);
    }
  };
  
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - selectedMedia.length);
      setSelectedMedia(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    // Aquí se implementaría la lógica para enviar la review
    const reviewData = {
      type: reviewType,
      itemId,
      orderId,
      rating,
      selectedChips,
      comment,
      media: selectedMedia
    };
    
    console.log('Review data:', reviewData);
    // TODO: Enviar datos al backend
    
    // Después de enviar, navegar de vuelta
    navigate(-1);
  };
  
  const getTitle = (): string => {
    if (reviewType === 'dish') return t('review.title.dish');
    if (reviewType === 'order') return t('review.title.order');
    return t('review.title.restaurant');
  };
  
  const getQuestion = (): string => {
    if (reviewType === 'dish') return t('review.question.dish');
    if (reviewType === 'order') return t('review.question.order');
    return t('review.question.restaurant');
  };
  
  const displayRating = hoveredRating > 0 ? hoveredRating : rating;
  
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            {getTitle()}
          </h2>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-md mx-auto pb-32 overflow-y-auto">
        {/* Star Rating Section */}
        <section className="p-4 mt-2">
          <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] mb-4 text-center">
            {getQuestion()}
          </h3>
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => handleStarHover(value)}
                onMouseLeave={handleStarLeave}
                className="focus:outline-none transition-transform active:scale-90"
              >
                <span
                  className={`material-symbols-outlined text-5xl ${
                    value <= displayRating
                      ? 'text-primary'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  style={{
                    fontVariationSettings: value <= displayRating ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
              {rating}.0 - {getRatingLabel(rating)}
            </p>
          )}
        </section>
        
        {/* Quick-Select Chips Section */}
        <section className="p-4">
          <h3 className="text-md font-bold leading-tight tracking-[-0.015em] mb-3">
            {t('review.whatDidYouLike')}
          </h3>
          
          {/* Input para buscar/agregar chips */}
          <div className="relative mb-3">
            <input
              type="text"
              value={chipInput}
              onChange={(e) => handleChipInputChange(e.target.value)}
              onFocus={() => {
                if (chipInput.trim() && filteredChipSuggestions.length > 0) {
                  setShowChipSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay para permitir que se ejecute el onClick de las sugerencias
                setTimeout(() => setShowChipSuggestions(false), 200);
              }}
              placeholder={t('review.searchOrAddChip')}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
            />
            
            {/* Sugerencias de autocompletado */}
            {showChipSuggestions && filteredChipSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredChipSuggestions.map((chip, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevenir que el onBlur se ejecute antes del onClick
                      toggleChip(chip);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm text-[#181511] dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            
            {/* Botón para agregar chip personalizado si no hay sugerencias exactas */}
            {chipInput.trim() && 
             filteredChipSuggestions.length === 0 && 
             !currentChipOptions.some(chip => chip.toLowerCase() === chipInput.toLowerCase()) && (
              <button
                type="button"
                onClick={handleAddCustomChip}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('review.add')}
              </button>
            )}
          </div>
          
          {/* Chips seleccionados y disponibles */}
          <div className="flex gap-2 flex-wrap">
            {currentChipOptions.map((chip, index) => {
              const isSelected = selectedChips.includes(chip);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`flex h-9 items-center justify-center gap-x-2 rounded-xl px-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-primary/10'
                  }`}
                >
                  <p className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                    {chip}
                  </p>
                </button>
              );
            })}
            
            {/* Mostrar chips personalizados agregados que no están en las opciones predeterminadas */}
            {selectedChips
              .filter(chip => !currentChipOptions.includes(chip))
              .map((chip, index) => (
                <button
                  key={`custom-${index}`}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className="flex h-9 items-center justify-center gap-x-2 rounded-xl px-4 cursor-pointer transition-colors bg-primary text-white shadow-sm"
                >
                  <p className="text-sm font-semibold">{chip}</p>
                </button>
              ))}
          </div>
        </section>
        
        {/* Comment Text Area Section */}
        <section className="p-4">
          <h3 className="text-md font-bold leading-tight tracking-[-0.015em] mb-3">
            {t('review.tellUsYourExperience')}
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
            placeholder={t('review.commentPlaceholder')}
          />
        </section>
        
        {/* Media Uploader Section */}
        <section className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-bold leading-tight tracking-[-0.015em]">
              {t('review.uploadPhotosOrVideos')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {selectedMedia.length} / 5 {t('review.selected')}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Add Button */}
            {selectedMedia.length < 5 && (
              <label className="flex-shrink-0 size-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-gray-400">add_a_photo</span>
                <span className="text-[10px] mt-1 font-bold text-gray-400 uppercase">
                  {t('review.upload')}
                </span>
              </label>
            )}
            
            {/* Selected Media Preview */}
            {selectedMedia.map((file, index) => (
              <div
                key={index}
                className="flex-shrink-0 size-20 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative group"
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-700">videocam</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            
            {/* Placeholder frames for remaining slots */}
            {Array.from({ length: Math.max(0, 5 - selectedMedia.length - 1) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="flex-shrink-0 size-20 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700">image</span>
              </div>
            ))}
          </div>
        </section>
        
        {/* Action Button */}
        <div className="px-4 mt-6 mb-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`w-full ${
              rating > 0
                ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            } text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98]`}
          >
            {t('review.publishReview')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ReviewScreen;
