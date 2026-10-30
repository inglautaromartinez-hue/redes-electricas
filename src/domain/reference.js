export function parseVoltage(raw) {
  if(raw===null||raw===undefined||String(raw).trim()==='')return null;
  const text=String(raw).trim().replace(',','.');
  if(!/^\d+(?:\.\d+)?\s*(?:kv)?$/i.test(text))return null;
  const value=Number(text.replace(/kv/i,'').trim());
  return Number.isFinite(value)&&value>0?value:null;
}
export function referenceProfile(raw, medium='unknown') {
  const voltage=parseVoltage(raw);
  const base={voltage,documented:false,legalStatus:'NOT_VERIFIED',reference:'EPRE 155/2025 · tabla II; verificar diseño y jurisdicción'};
  if([13.2,33].includes(voltage)){
    const values={unknown:[2.25,4,'Tipo constructivo sin identificar'],open:[4,4,'Escenario: desnuda / protegida'],bundled:[2.25,2.25,'Escenario: preensamblada'],compact:[2.6,2.65,'Escenario compacto · discrepancia normativa']};
    if(!values[medium])throw new Error('PROFILE_INVALID');
    const [min,max,label]=values[medium];
    return {...base,min,max,label,uncertain:true,requiresClarification:medium==='compact',reason:medium==='unknown'?'CONSTRUCTION_UNKNOWN':'USER_SCENARIO'};
  }
  if(voltage===66||voltage===132)return {...base,min:voltage===66?11:14,max:voltage===66?11:14,label:`Referencia típica ${voltage} kV`,uncertain:true,reason:'DESIGN_AND_JURISDICTION_UNVERIFIED'};
  return {...base,min:null,max:null,label:voltage?`${voltage} kV · ancho a verificar`:'Tensión sin identificar',uncertain:true,reason:'NO_REFERENCE_WIDTH'};
}
