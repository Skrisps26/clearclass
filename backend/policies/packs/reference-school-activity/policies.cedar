// EPA/AirNow School Flag guidance is a project reference adaptation, not local law.
// AQI values are U.S. AQI values only; this pack does not convert another index.

@id("reference-school-activity.allow-ordinary-through-usg")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"ordinary_outdoor",
    resource
)
when {
    context.aqi >= 0 && context.aqi <= 150
};

@id("reference-school-activity.allow-sport-through-moderate")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"prolonged_intense_sport",
    resource
)
when {
    context.aqi >= 0 && context.aqi <= 100
};

@id("reference-school-activity.allow-sport-usg-modified")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"sport_with_breaks_reduced_intensity",
    resource
)
when {
    context.aqi >= 101 && context.aqi <= 150
};

@id("reference-school-activity.allow-ordinary-unhealthy-modified")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"ordinary_with_breaks_reduced_intensity",
    resource
)
when {
    context.aqi >= 151 && context.aqi <= 200
};

@id("reference-school-activity.allow-sport-unhealthy-modified")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"sport_with_breaks_reduced_intensity",
    resource
)
when {
    context.aqi >= 151 && context.aqi <= 200
};

@id("reference-school-activity.forbid-outdoor-very-unhealthy")
@source("epa-airnow-school-guide:p1")
forbid (
    principal,
    action in [
        Action::"ordinary_outdoor",
        Action::"prolonged_intense_sport",
        Action::"ordinary_with_breaks_reduced_intensity",
        Action::"sport_with_breaks_reduced_intensity"
    ],
    resource
)
when {
    context.aqi >= 201 && context.aqi <= 300
};

@id("reference-school-activity.allow-indoor-or-reschedule-very-unhealthy")
@source("epa-airnow-school-guide:p1")
permit (
    principal,
    action == Action::"indoor_relocation_or_reschedule",
    resource
)
when {
    context.aqi >= 201 && context.aqi <= 300
};
