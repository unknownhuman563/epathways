@php $signature = $signature ?? null; $signedMeta = $signedMeta ?? null; @endphp
<h2 class="section">Accommodation Information Declaration</h2>

<p>The following declaration must be completed by the tenant/occupant named below and witnessed by a person authorised to take statutory declarations (Justice of the Peace or solicitor).</p>

<p class="strong">It is a criminal offence to make a false declaration.</p>

<p class="decl-line">I, <span class="ln">{{ $signedMeta['signer_name'] ?? '' }}</span></p>
<p class="decl-cap">[full name of tenant/occupant] &nbsp;&nbsp; [occupation]</p>

<p class="decl-line">of <span class="ln"></span></p>
<p class="decl-cap">[residential address of the accommodation being declared]</p>

<p>solemnly and sincerely declare that:</p>
<ul class="bullets">
    <li>I am the tenant / occupant (delete as appropriate) of the property named above;</li>
    <li>The accommodation information supplied on this form is true and correct;</li>
    <li>I understand that the address supplied above is my usual place of residence for the duration of my stay;</li>
    <li>I will advise Exalt Property Management immediately of any change of address.</li>
</ul>

<p>I acknowledge that I am aware that:</p>
<ul class="bullets">
    <li>Exalt Property Management may collect information for the purpose of verifying the details provided are accurate;</li>
    <li>If it is found the address supplied is not my usual place of residence, my tenancy or application may be affected or annulled.</li>
</ul>

<p>I make this solemn declaration conscientiously believing the same to be true and by virtue of the Oaths and Declarations Act 1957.</p>

<p>Note: Do not complete the section below until you are with the person witnessing your declaration.</p>

<p class="decl-line">Declared at
    @if($signature)<img src="{{ $signature }}" alt="Signature" style="max-height:32px; vertical-align:middle;">@endif
    <span class="ln">{{ $signedMeta['signed_at'] ?? '' }}</span></p>
<p class="decl-cap">[signature of tenant/occupant] &nbsp;&nbsp; day month year</p>

<p class="decl-line">Before me <span class="ln"></span></p>
<p class="decl-cap">[name of official witness]</p>

<p class="decl-line"><span class="ln"></span></p>
<p class="decl-cap">[signature of witness] &nbsp;&nbsp; Justice of the Peace / Solicitor (delete as appropriate)</p>
